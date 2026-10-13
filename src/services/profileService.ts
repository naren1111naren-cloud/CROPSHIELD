import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db, isFirebaseConfigured, auth } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';
import { FarmerProfile } from '../types';

/**
 * Fetch a farmer's profile from Firestore
 */
export async function getFarmerProfile(uid: string): Promise<FarmerProfile | null> {
  if (!isFirebaseConfigured || !db) return null;
  const path = `profiles/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'profiles', uid));
    if (!snap.exists()) return null;
    return snap.data() as FarmerProfile;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    throw error;
  }
}

/**
 * Create or update a farmer profile in profiles/{uid}
 * Reuses existing document to prevent duplicates and preserves createdAt timestamp.
 */
export async function saveFarmerProfile(
  uid: string,
  data: Partial<FarmerProfile>
): Promise<FarmerProfile> {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firebase configuration is not available.');
  }

  // Security guard: Ensure we only mutate under the authenticated user's UID
  if (auth?.currentUser && auth.currentUser.uid !== uid) {
    throw new Error('Unauthorized: profile UID must match the authenticated session UID.');
  }

  const path = `profiles/${uid}`;
  const profileRef = doc(db, 'profiles', uid);

  try {
    const existingSnap = await getDoc(profileRef);

    if (existingSnap.exists()) {
      // Update existing profile
      const updatePayload: Record<string, any> = {
        ...data,
        uid, // Never permit changing the UID
        updatedAt: serverTimestamp(),
      };
      // Prevent stripping required fields if partial update
      await setDoc(profileRef, updatePayload, { merge: true });
      return {
        ...(existingSnap.data() as FarmerProfile),
        ...data,
        uid,
      };
    } else {
      // Create new profile with required fields and server timestamps
      const newProfile: FarmerProfile = {
        uid,
        displayName: data.displayName?.trim() || auth?.currentUser?.displayName || 'Farmer',
        preferredLanguage: data.preferredLanguage || 'en',
        district: data.district?.trim() || 'Thanjavur',
        locality: data.locality?.trim() || '',
        primaryCrop: data.primaryCrop?.trim() || 'Rice (Paddy)',
        activeVariety: data.activeVariety?.trim() || 'CR 1009 Sub 1',
        plantingDate: data.plantingDate || '',
        cropStage: data.cropStage || 'Tillering',
        landSizeAcres: typeof data.landSizeAcres === 'number' ? data.landSizeAcres : 2.5,
        email: data.email || auth?.currentUser?.email || '',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(profileRef, newProfile);
      return newProfile;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

/**
 * Update partial fields on an existing farmer profile
 */
export async function updateFarmerProfile(
  uid: string,
  data: Partial<FarmerProfile>
): Promise<void> {
  await saveFarmerProfile(uid, data);
}

/**
 * Real-time listener for farmer profile document
 */
export function subscribeFarmerProfile(
  uid: string,
  onProfile: (profile: FarmerProfile | null) => void,
  onError?: (err: any) => void
): () => void {
  if (!isFirebaseConfigured || !db) {
    onProfile(null);
    return () => {};
  }

  const path = `profiles/${uid}`;
  return onSnapshot(
    doc(db, 'profiles', uid),
    (snap) => {
      if (snap.exists()) {
        onProfile(snap.data() as FarmerProfile);
      } else {
        onProfile(null);
      }
    },
    (error) => {
      console.error('Error listening to farmer profile:', error);
      onError?.(error);
      handleFirestoreError(error, OperationType.GET, path);
    }
  );
}
