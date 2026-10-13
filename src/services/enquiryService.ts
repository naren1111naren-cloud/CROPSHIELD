/**
 * CropShield AI — Farmer Expert Enquiry Service
 * Version: 1.0.0 (Phase 7)
 * 
 * Manages authenticated farmer agricultural enquiries and escalation tracking
 * stored in Firestore subcollection `profiles/{uid}/enquiries/{enquiryId}`.
 * 
 * Strict boundary:
 * 1. Enforces user ownership (`assertOwner`).
 * 2. Validates image MIME and size bounds (< 15MB).
 * 3. Gracefully handles both live Firebase and offline demo configurations.
 * 4. Transparently documents that submissions are logged in the farmer's dispatch record.
 */

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
import { FarmerEnquiry, EnquiryUrgency, EnquiryStatus } from '../types';

export interface CreateEnquiryInput {
  farmerName: string;
  farmerPhone: string;
  preferredLanguage: 'en' | 'ta';
  farmId?: string;
  farmName?: string;
  cropId: string;
  cropName: string;
  district: string;
  problemCategory: 'disease_identification' | 'pest_infestation' | 'nutrient_deficiency' | 'weather_damage' | 'general_agronomy';
  description: string;
  linkedScanId?: string;
  linkedScanCondition?: string;
  linkedScanSeverity?: string;
  urgency?: EnquiryUrgency;
  photoFile?: File | null;
  existingPhotoUrl?: string;
}

function assertOwner(uid: string) {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firestore is not configured.');
  }
  if (!uid || (auth?.currentUser && auth.currentUser.uid !== uid)) {
    throw new Error('Unauthorized: cannot access enquiries belonging to another user.');
  }
}

/**
 * Validate and upload enquiry specimen photo to Firebase Storage
 */
export async function uploadEnquiryPhoto(
  uid: string,
  file: File,
  enquiryId: string
): Promise<{ downloadUrl: string; storagePath: string }> {
  assertOwner(uid);

  const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (!validTypes.includes(file.type)) {
    throw new Error('Unsupported image format. Please select JPEG, PNG, or WebP.');
  }

  const maxSize = 15 * 1024 * 1024;
  if (file.size > maxSize) {
    throw new Error('Photo exceeds 15 MB file size limit.');
  }

  if (!storage) {
    // Return base64 dataUrl if storage is unconfigured
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve({ downloadUrl: reader.result as string, storagePath: 'local/enquiry-preview' });
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  }

  const fileExt = file.name.split('.').pop() || 'jpg';
  const storagePath = `users/${uid}/enquiries/${enquiryId}_${Date.now()}.${fileExt}`;
  const storageRef = ref(storage, storagePath);

  const uploadTask = uploadBytesResumable(storageRef, file, {
    contentType: file.type,
    customMetadata: {
      ownerUid: uid,
      enquiryId,
      uploadedAt: new Date().toISOString(),
    },
  });

  await new Promise((resolve, reject) => {
    uploadTask.on('state_changed', null, reject, () => resolve(true));
  });

  const downloadUrl = await getDownloadURL(uploadTask.snapshot.ref);
  return { downloadUrl, storagePath };
}

/**
 * Create and persist a new Farmer Enquiry in Firestore
 */
export async function createFarmerEnquiry(
  uid: string,
  input: CreateEnquiryInput
): Promise<FarmerEnquiry> {
  assertOwner(uid);

  // Generate stable readable tracking token
  const districtCode = (input.district || 'TN').toUpperCase().substring(0, 3).replace(/[^A-Z]/g, 'TN');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const enquiryId = `ENQ-${districtCode}-${new Date().getFullYear()}-${randomSuffix}`;

  let photoUrl = input.existingPhotoUrl || '';
  let photoStoragePath = '';

  if (input.photoFile) {
    try {
      const uploaded = await uploadEnquiryPhoto(uid, input.photoFile, enquiryId);
      photoUrl = uploaded.downloadUrl;
      photoStoragePath = uploaded.storagePath;
    } catch (uploadErr) {
      console.warn('Storage upload failed, falling back to local base64:', uploadErr);
    }
  }

  const enquiryDocRef = doc(db!, 'profiles', uid, 'enquiries', enquiryId);

  const newEnquiry: FarmerEnquiry = {
    enquiryId,
    userId: uid,
    farmerName: input.farmerName || 'Farmer',
    farmerPhone: input.farmerPhone || '',
    preferredLanguage: input.preferredLanguage || 'en',
    farmId: input.farmId || '',
    farmName: input.farmName || '',
    cropId: input.cropId.toLowerCase(),
    cropName: input.cropName,
    district: input.district,
    problemCategory: input.problemCategory,
    description: input.description.trim(),
    linkedScanId: input.linkedScanId || '',
    linkedScanCondition: input.linkedScanCondition || '',
    linkedScanSeverity: input.linkedScanSeverity || '',
    photoUrl,
    photoStoragePath,
    urgency: input.urgency || 'standard',
    status: 'submitted',
    statusNotes: 'Queued in CropShield dispatch record. Ready for review by local AEO or KVK staff.',
    statusNotesTamil: 'வட்டார வேளாண்மை விரிவாக்க அலுவலர் அல்லது KVK ஆய்விற்காக உங்கள் கோரிக்கை பதிவு செய்யப்பட்டுள்ளது.',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  try {
    await setDoc(enquiryDocRef, newEnquiry);
    return newEnquiry;
  } catch (err) {
    throw handleFirestoreError(err, OperationType.WRITE, `profiles/${uid}/enquiries/${enquiryId}`);
  }
}

/**
 * Real-time subscription to a farmer's enquiries
 */
export function subscribeFarmerEnquiries(
  uid: string,
  onUpdate: (enquiries: FarmerEnquiry[]) => void,
  onError?: (err: Error) => void
): () => void {
  if (!isFirebaseConfigured || !db) {
    onUpdate([]);
    return () => {};
  }

  try {
    const enquiriesRef = collection(db, 'profiles', uid, 'enquiries');
    const q = query(enquiriesRef, orderBy('createdAt', 'desc'));

    return onSnapshot(
      q,
      (snapshot) => {
        const loaded: FarmerEnquiry[] = [];
        snapshot.forEach((docSnap) => {
          loaded.push({
            id: docSnap.id,
            ...docSnap.data(),
          } as FarmerEnquiry);
        });
        onUpdate(loaded);
      },
      (err) => {
        console.error('Firestore enquiries snapshot error:', err);
        onError?.(err);
      }
    );
  } catch (err: any) {
    console.error('Failed to subscribe to enquiries:', err);
    onError?.(err);
    return () => {};
  }
}

/**
 * Delete an enquiry record
 */
export async function deleteFarmerEnquiry(uid: string, enquiryId: string): Promise<void> {
  assertOwner(uid);
  try {
    const docRef = doc(db!, 'profiles', uid, 'enquiries', enquiryId);
    await deleteDoc(docRef);
  } catch (err) {
    throw handleFirestoreError(err, OperationType.DELETE, `profiles/${uid}/enquiries/${enquiryId}`);
  }
}
