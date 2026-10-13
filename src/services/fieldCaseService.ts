/**
 * CropShield AI — Field Case Service
 * Version: 1.0.0
 * 
 * Manages the lifecycle of Field Cases and Observations:
 * - Creates versioned field cases and immutable observations
 * - Enforces user-isolated Firestore access (profiles/{uid}/fieldCases/{caseId})
 * - Handles image uploads with MIME and size verification
 * - Supports symptom progression tracking across multiple visits
 */

import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  updateDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { db, storage, isFirebaseConfigured, auth } from '../lib/firebase';
import {
  FieldCaseRecord,
  FieldObservation,
  FieldObservationInput,
  DifferentialCandidate,
  ActionPlan,
  EvidenceSeparation,
  FieldCaseStatus,
} from '../types';

/**
 * Asserts user ownership
 */
function assertOwner(uid: string) {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firestore is not configured.');
  }
  if (!uid || (auth?.currentUser && auth.currentUser.uid !== uid)) {
    throw new Error('Unauthorized: cannot access field cases belonging to another farmer.');
  }
}

/**
 * Generates an authentic case token: CASE-TN-YYYY-XXXX
 */
export function generateCaseToken(year = new Date().getFullYear()): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let randomHex = '';
  for (let i = 0; i < 4; i++) {
    randomHex += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `CASE-TN-${year}-${randomHex}`;
}

export interface CreateCaseParams {
  cropId: 'rice' | 'tomato' | 'chilli' | 'cotton' | 'maize';
  cropName: string;
  cropNameTamil: string;
  variety: string;
  district: string;
  farmId?: string;
  farmName?: string;
  imageFile?: File | null;
  imageUrlFallback: string;
  secondaryImageFile?: File | null;
  secondaryImageUrlFallback?: string;
  cropStage: string;
  farmerInput: FieldObservationInput;
  differentialAssessment: DifferentialCandidate[];
  actionPlan: ActionPlan;
  evidenceSeparation: EvidenceSeparation;
  isInconclusive: boolean;
  inconclusiveReason?: string;
  inconclusiveReasonTamil?: string;
}

/**
 * Uploads an image to Firebase Storage with size (<15MB) and type validation
 */
async function uploadCasePhoto(uid: string, file: File, prefix = 'cases'): Promise<string> {
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Unsupported format. Please upload JPEG, PNG, or WebP.');
  }
  if (file.size > 15 * 1024 * 1024) {
    throw new Error('Photo exceeds 15 MB limit.');
  }

  if (!isFirebaseConfigured || !storage) {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.readAsDataURL(file);
    });
  }

  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 8);
  const ext = file.name.split('.').pop() || 'jpg';
  const path = `${prefix}/${uid}/${timestamp}_${randomSuffix}.${ext}`;
  const storageRef = ref(storage, path);

  const uploadTask = await uploadBytesResumable(storageRef, file, {
    contentType: file.type,
    customMetadata: { ownerUid: uid },
  });

  return await getDownloadURL(uploadTask.ref);
}

/**
 * Creates a new Field Case with an initial Observation
 */
export async function createFieldCase(
  uid: string,
  params: CreateCaseParams
): Promise<{ caseRecord: FieldCaseRecord; observation: FieldObservation }> {
  assertOwner(uid);

  const now = new Date();
  const nowIso = now.toISOString();
  const caseId = `case_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const obsId = `obs_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const caseToken = generateCaseToken(now.getFullYear());

  let finalImageUrl = params.imageUrlFallback;
  if (params.imageFile) {
    try {
      finalImageUrl = await uploadCasePhoto(uid, params.imageFile, `field_cases/${caseId}`);
    } catch (err) {
      console.warn('Storage upload failed, falling back to provided preview:', err);
      finalImageUrl = params.imageUrlFallback;
    }
  }

  let finalSecondaryUrl = params.secondaryImageUrlFallback;
  if (params.secondaryImageFile) {
    try {
      finalSecondaryUrl = await uploadCasePhoto(uid, params.secondaryImageFile, `field_cases/${caseId}`);
    } catch (err) {
      finalSecondaryUrl = params.secondaryImageUrlFallback;
    }
  }

  const primaryCandidate = params.differentialAssessment[0];
  const primarySuspected = primaryCandidate ? primaryCandidate.conditionName : 'Pending In-Field Evaluation';
  const primarySuspectedTa = primaryCandidate ? primaryCandidate.conditionNameTamil : 'கள ஆய்வு நிலுவையில் உள்ளது';

  // Calculate suggested next reinspection date (e.g. +4 days)
  const reinspectionDate = new Date();
  reinspectionDate.setDate(reinspectionDate.getDate() + (params.actionPlan.reinspectionAdvice.suggestedIntervalDays || 4));

  const initialObservation: FieldObservation = {
    id: obsId,
    caseId,
    userId: uid,
    observationIndex: 1,
    createdAt: nowIso,
    imageUrl: finalImageUrl,
    secondaryImageUrl: finalSecondaryUrl,
    cropStage: params.cropStage,
    farmerInput: params.farmerInput,
    differentialAssessment: params.differentialAssessment,
    actionPlan: params.actionPlan,
    evidenceSeparation: params.evidenceSeparation,
    isInconclusive: params.isInconclusive,
    inconclusiveReason: params.inconclusiveReason,
    inconclusiveReasonTamil: params.inconclusiveReasonTamil,
  };

  const caseRecord: FieldCaseRecord = {
    id: caseId,
    caseToken,
    userId: uid,
    farmId: params.farmId,
    farmName: params.farmName,
    cropId: params.cropId,
    cropName: params.cropName,
    cropNameTamil: params.cropNameTamil,
    variety: params.variety,
    district: params.district,
    initialDate: nowIso,
    latestObservationDate: nowIso,
    status: 'active',
    primarySuspectedCondition: primarySuspected,
    primarySuspectedConditionTamil: primarySuspectedTa,
    observationCount: 1,
    latestObservationId: obsId,
    latestActionPlan: params.actionPlan,
    latestDifferential: params.differentialAssessment,
    nextReinspectionDate: reinspectionDate.toISOString(),
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  // Write case document
  const caseDocRef = doc(db!, 'profiles', uid, 'fieldCases', caseId);
  await setDoc(caseDocRef, caseRecord);

  // Write observation subcollection document
  const obsDocRef = doc(db!, 'profiles', uid, 'fieldCases', caseId, 'observations', obsId);
  await setDoc(obsDocRef, initialObservation);

  return { caseRecord, observation: initialObservation };
}

export interface AddFollowUpParams {
  imageFile?: File | null;
  imageUrlFallback: string;
  secondaryImageFile?: File | null;
  secondaryImageUrlFallback?: string;
  cropStage: string;
  farmerInput: FieldObservationInput;
  differentialAssessment: DifferentialCandidate[];
  actionPlan: ActionPlan;
  evidenceSeparation: EvidenceSeparation;
  isInconclusive: boolean;
  inconclusiveReason?: string;
  inconclusiveReasonTamil?: string;
  farmerReportedProgressionNote?: string;
  updatedStatus?: FieldCaseStatus;
}

/**
 * Appends a follow-up observation to an existing Field Case without overwriting history
 */
export async function addFollowUpObservation(
  uid: string,
  caseId: string,
  params: AddFollowUpParams
): Promise<FieldObservation> {
  assertOwner(uid);

  const caseDocRef = doc(db!, 'profiles', uid, 'fieldCases', caseId);
  const caseSnap = await getDoc(caseDocRef);
  if (!caseSnap.exists()) {
    throw new Error('Field case not found.');
  }

  const existingCase = caseSnap.data() as FieldCaseRecord;
  const newIndex = (existingCase.observationCount || 1) + 1;
  const nowIso = new Date().toISOString();
  const obsId = `obs_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;

  let finalImageUrl = params.imageUrlFallback;
  if (params.imageFile) {
    try {
      finalImageUrl = await uploadCasePhoto(uid, params.imageFile, `field_cases/${caseId}`);
    } catch (err) {
      finalImageUrl = params.imageUrlFallback;
    }
  }

  let finalSecondaryUrl = params.secondaryImageUrlFallback;
  if (params.secondaryImageFile) {
    try {
      finalSecondaryUrl = await uploadCasePhoto(uid, params.secondaryImageFile, `field_cases/${caseId}`);
    } catch (err) {
      finalSecondaryUrl = params.secondaryImageUrlFallback;
    }
  }

  const newObservation: FieldObservation = {
    id: obsId,
    caseId,
    userId: uid,
    observationIndex: newIndex,
    createdAt: nowIso,
    imageUrl: finalImageUrl,
    secondaryImageUrl: finalSecondaryUrl,
    cropStage: params.cropStage,
    farmerInput: params.farmerInput,
    differentialAssessment: params.differentialAssessment,
    actionPlan: params.actionPlan,
    evidenceSeparation: params.evidenceSeparation,
    isInconclusive: params.isInconclusive,
    inconclusiveReason: params.inconclusiveReason,
    inconclusiveReasonTamil: params.inconclusiveReasonTamil,
    farmerReportedProgressionNote: params.farmerReportedProgressionNote,
  };

  // Write observation document
  const obsDocRef = doc(db!, 'profiles', uid, 'fieldCases', caseId, 'observations', obsId);
  await setDoc(obsDocRef, newObservation);

  const primaryCandidate = params.differentialAssessment[0];
  const primarySuspected = primaryCandidate ? primaryCandidate.conditionName : existingCase.primarySuspectedCondition;
  const primarySuspectedTa = primaryCandidate ? primaryCandidate.conditionNameTamil : existingCase.primarySuspectedConditionTamil;

  // Update parent case summary
  await updateDoc(caseDocRef, {
    observationCount: newIndex,
    latestObservationDate: nowIso,
    latestObservationId: obsId,
    latestActionPlan: params.actionPlan,
    latestDifferential: params.differentialAssessment,
    primarySuspectedCondition: primarySuspected,
    primarySuspectedConditionTamil: primarySuspectedTa,
    status: params.updatedStatus || existingCase.status || 'monitoring',
    updatedAt: serverTimestamp(),
  });

  return newObservation;
}

/**
 * Subscribes in real-time to a farmer's field cases
 */
export function subscribeFarmerFieldCases(
  uid: string,
  onUpdate: (cases: FieldCaseRecord[]) => void,
  onError: (err: any) => void
): () => void {
  if (!isFirebaseConfigured || !db) {
    onUpdate([]);
    return () => {};
  }

  const casesCol = collection(db, 'profiles', uid, 'fieldCases');
  const q = query(casesCol, orderBy('updatedAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const records: FieldCaseRecord[] = [];
      snapshot.forEach((docSnap) => {
        records.push({ id: docSnap.id, ...docSnap.data() } as FieldCaseRecord);
      });
      onUpdate(records);
    },
    (error) => {
      console.error('Error listening to field cases:', error);
      onError(error);
    }
  );
}

/**
 * Fetches all observations for a specific case ordered chronologically
 */
export async function fetchCaseObservations(uid: string, caseId: string): Promise<FieldObservation[]> {
  assertOwner(uid);

  const obsCol = collection(db, 'profiles', uid, 'fieldCases', caseId, 'observations');
  const q = query(obsCol, orderBy('observationIndex', 'asc'));
  const snap = await getDocs(q);

  const observations: FieldObservation[] = [];
  snap.forEach((docSnap) => {
    observations.push({ id: docSnap.id, ...docSnap.data() } as FieldObservation);
  });
  return observations;
}

/**
 * Updates status of a Field Case
 */
export async function updateFieldCaseStatus(
  uid: string,
  caseId: string,
  status: FieldCaseStatus
): Promise<void> {
  assertOwner(uid);
  const caseDocRef = doc(db!, 'profiles', uid, 'fieldCases', caseId);
  await updateDoc(caseDocRef, {
    status,
    updatedAt: serverTimestamp(),
  });
}
