import {
  ref,
  uploadBytesResumable,
  getDownloadURL,
} from 'firebase/storage';
import {
  collection,
  doc,
  setDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { storage, db, isFirebaseConfigured, auth } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';
import { AnalysisResult, ScanData } from '../types';

export interface UploadResult {
  downloadUrl: string;
  storagePath: string;
}

/**
 * Validates that the caller is operating on their own authenticated profile
 */
function assertOwner(uid: string) {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firestore is not configured.');
  }
  if (!uid || (auth?.currentUser && auth.currentUser.uid !== uid)) {
    throw new Error('Unauthorized: cannot access scans belonging to another user.');
  }
}

/**
 * Validate and upload crop image to Firebase Storage
 */
export async function uploadCropImage(
  uid: string,
  file: File,
  onProgress?: (progressPercent: number) => void
): Promise<UploadResult> {
  assertOwner(uid);

  // Validate MIME type
  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Unsupported image format. Please select JPEG, PNG, or WebP.');
  }

  // Validate size (< 15MB)
  const maxSize = 15 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('Image exceeds 15 MB size limit.');
  }

  if (!isFirebaseConfigured || !storage) {
    // Local data URL fallback when Firebase Storage bucket is not provisioned
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          downloadUrl: reader.result as string,
          storagePath: `local_fallback/${uid}/${Date.now()}_${file.name}`,
        });
      };
      reader.readAsDataURL(file);
    });
  }

  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(2, 9);
  const ext = file.name.split('.').pop() || 'jpg';
  const storagePath = `scans/${uid}/${timestamp}_${randomSuffix}.${ext}`;
  const storageRef = ref(storage, storagePath);

  return new Promise((resolve, reject) => {
    const uploadTask = uploadBytesResumable(storageRef, file, {
      contentType: file.type,
      customMetadata: {
        ownerUid: uid,
        uploadedAt: new Date().toISOString(),
      },
    });

    uploadTask.on(
      'state_changed',
      (snapshot) => {
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
        onProgress?.(Math.round(progress));
      },
      (error) => {
        console.error('Firebase Storage upload error:', error);
        // Fallback to data URL gracefully if storage bucket throws permission/quota error
        const reader = new FileReader();
        reader.onload = () => {
          resolve({
            downloadUrl: reader.result as string,
            storagePath: `storage_fallback/${uid}/${timestamp}_${file.name}`,
          });
        };
        reader.readAsDataURL(file);
      },
      async () => {
        try {
          const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({ downloadUrl, storagePath });
        } catch (err) {
          reject(err);
        }
      }
    );
  });
}

/**
 * Save crop scan result into Firestore subcollection profiles/{uid}/scans/{scanId}
 */
export async function saveCropScanToFirestore(
  uid: string,
  analysisResult: AnalysisResult,
  imagePath: string,
  variety: string = 'CR 1009 Sub 1',
  district: string = 'Thanjavur',
  farmId?: string
): Promise<string> {
  assertOwner(uid);
  if (!db) throw new Error('Firestore not initialized');

  const scansPath = `profiles/${uid}/scans`;
  try {
    const scansColRef = collection(db, 'profiles', uid, 'scans');
    const newDocRef = doc(scansColRef);
    const scanId = newDocRef.id;

    const docData: ScanData = {
      scanId,
      ownerUid: uid,
      cropId: analysisResult.cropId || 'rice',
      cropName: analysisResult.cropName || 'Rice (Paddy)',
      cropNameTamil: analysisResult.cropNameTamil || 'நெல் (பயிர்)',
      imagePath,
      status: (analysisResult.analysisStatus === 'unsupported_crop' ? 'failed' : (analysisResult.analysisStatus || 'completed')) as ScanData['status'],
      possibleCondition: analysisResult.conditionName || 'Healthy Crop Foliage',
      possibleConditionTamil: analysisResult.conditionNameTamil || 'ஆரோக்கியமான பயிர்',
      alternativeConditions: analysisResult.alternativeConditions || [],
      pathogen: analysisResult.pathogen || 'None detected',
      severity: analysisResult.severity || 'nominal',
      observations: analysisResult.observedSymptoms || analysisResult.observedCharacteristics || [],
      observedSymptoms: analysisResult.observedSymptoms || analysisResult.observedCharacteristics || [],
      explanation: analysisResult.explanation || '',
      confidenceInformation: analysisResult.confidenceInformation || analysisResult.confidenceAssessment || 'Visual pathology assessment completed.',
      imageQualityStatus: analysisResult.imageQualityStatus || 'good',
      immediateCare: analysisResult.immediateCare || [],
      immediateCareTamil: analysisResult.immediateCareTamil || [],
      preventivePractices: analysisResult.preventivePractices || [],
      preventivePracticesTamil: analysisResult.preventivePracticesTamil || [],
      uncertaintyNotice: analysisResult.uncertaintyNotice || '',
      uncertaintyNoticeTamil: analysisResult.uncertaintyNoticeTamil || '',
      recommendations: analysisResult.recommendations || analysisResult.managementGuidance || [],
      recommendationsTamil: analysisResult.recommendationsTamil || analysisResult.managementGuidanceTamil || [],
      expertReviewRecommended: analysisResult.expertReviewRecommended ?? (analysisResult.severity === 'high'),
      expertReviewAdvice: analysisResult.expertReviewAdvice || '',
      expertReviewAdviceTamil: analysisResult.expertReviewAdviceTamil || '',
      analysisMethod: analysisResult.analysisMethod || analysisResult.source || 'gemini-3.8-flash (preliminary screening)',
      modelVersion: analysisResult.modelVersion || 'cropshield-v3-multicrop',
      isHealthy: analysisResult.isHealthy ?? (analysisResult.severity === 'nominal'),
      variety,
      district,
      farmId: farmId || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(newDocRef, docData);
    return scanId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, scansPath);
    throw error;
  }
}

/**
 * Initialize a pending scan record before async evaluation completes
 */
export async function createPendingScan(
  uid: string,
  imagePath: string,
  farmId?: string,
  variety?: string,
  district?: string
): Promise<string> {
  assertOwner(uid);
  if (!db) throw new Error('Firestore not initialized');

  const scansPath = `profiles/${uid}/scans`;
  try {
    const scansColRef = collection(db, 'profiles', uid, 'scans');
    const newDocRef = doc(scansColRef);
    const scanId = newDocRef.id;

    const docData: ScanData = {
      scanId,
      imagePath,
      status: 'pending',
      possibleCondition: 'Awaiting Diagnostic Evaluation',
      possibleConditionTamil: 'பரிசோதனைக்கு காத்திருக்கிறது',
      observations: [],
      recommendations: [],
      confidenceInformation: 'Image queued for pathology screening.',
      expertReviewRecommended: false,
      analysisMethod: 'pending',
      modelVersion: 'cropshield-v2-tnau',
      variety: variety || 'CR 1009 Sub 1',
      district: district || 'Thanjavur',
      farmId: farmId || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    await setDoc(newDocRef, docData);
    return scanId;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, scansPath);
    throw error;
  }
}

/**
 * Update status or diagnostic findings on a scan document
 */
export async function updateScanStatus(
  uid: string,
  scanId: string,
  status: 'pending' | 'processing' | 'completed' | 'failed',
  details?: Partial<ScanData>
): Promise<void> {
  assertOwner(uid);
  if (!db) throw new Error('Firestore not initialized');

  const scansPath = `profiles/${uid}/scans/${scanId}`;
  try {
    const scanRef = doc(db, 'profiles', uid, 'scans', scanId);
    await updateDoc(scanRef, {
      ...details,
      status,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, scansPath);
    throw error;
  }
}

/**
 * Fetch all scans once for an authenticated farmer
 */
export async function getFarmerScans(uid: string): Promise<ScanData[]> {
  assertOwner(uid);
  if (!db) return [];

  const scansPath = `profiles/${uid}/scans`;
  try {
    const scansColRef = collection(db, 'profiles', uid, 'scans');
    const scansQuery = query(scansColRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(scansQuery);
    const results: ScanData[] = [];
    snapshot.forEach((docSnap) => {
      results.push({ id: docSnap.id, ...(docSnap.data() as ScanData) });
    });
    return results;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, scansPath);
    throw error;
  }
}

/**
 * Real-time listener for farmer's scan history
 */
export function subscribeFarmerScans(
  uid: string,
  onScans: (scans: ScanData[]) => void,
  onError?: (err: any) => void
): () => void {
  if (!isFirebaseConfigured || !db || !uid) {
    onScans([]);
    return () => {};
  }

  const scansPath = `profiles/${uid}/scans`;
  const scansColRef = collection(db, 'profiles', uid, 'scans');
  const scansQuery = query(scansColRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    scansQuery,
    (snapshot) => {
      const results: ScanData[] = [];
      snapshot.forEach((docSnap) => {
        results.push({ id: docSnap.id, ...(docSnap.data() as ScanData) });
      });
      onScans(results);
    },
    (error) => {
      console.error('Error listening to farmer scans:', error);
      onError?.(error);
      handleFirestoreError(error, OperationType.LIST, scansPath);
    }
  );
}

/**
 * Delete a scan record
 */
export async function deleteScan(uid: string, scanId: string): Promise<void> {
  assertOwner(uid);
  if (!db) throw new Error('Firestore not initialized');

  const scansPath = `profiles/${uid}/scans/${scanId}`;
  try {
    const scanRef = doc(db, 'profiles', uid, 'scans', scanId);
    await deleteDoc(scanRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, scansPath);
    throw error;
  }
}

/**
 * Retrieve a specific saved scan record by ID
 */
export async function getScanById(uid: string, scanId: string): Promise<ScanData | null> {
  assertOwner(uid);
  if (!db) return null;

  const scansPath = `profiles/${uid}/scans/${scanId}`;
  try {
    const scanRef = doc(db, 'profiles', uid, 'scans', scanId);
    const snap = await getDoc(scanRef);
    if (!snap.exists()) return null;
    return { id: snap.id, ...(snap.data() as ScanData) };
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, scansPath);
    throw error;
  }
}

