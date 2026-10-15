import { doc, getDoc, setDoc, onSnapshot, serverTimestamp } from 'firebase/firestore';
import { db, isFirebaseConfigured, auth } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';
import { FarmerProfile } from '../types';

/**
 * Fetch a farmer's profile from Firestore
 */
export async function getFarmerProfile(uid: string): Promise<FarmerProfile | null> {
  const localKey = `cropshield_profile_${uid}`;
  const loadLocal = (): FarmerProfile | null => {
    try {
      const cached = localStorage.getItem(localKey);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  };

  if (!isFirebaseConfigured || !db) return loadLocal();
  const path = `profiles/${uid}`;
  try {
    const snap = await getDoc(doc(db, 'profiles', uid));
    if (!snap.exists()) return loadLocal();
    const data = snap.data() as FarmerProfile;
    try {
      localStorage.setItem(localKey, JSON.stringify(data));
    } catch {}
    return data;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, path);
    return loadLocal();
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
  const localKey = `cropshield_profile_${uid}`;

  // Security guard: Ensure we only mutate under the authenticated user's UID
  if (auth?.currentUser && auth.currentUser.uid !== uid) {
    throw new Error('Unauthorized: profile UID must match the authenticated session UID.');
  }

  const fallbackProfile: FarmerProfile = {
    uid,
    displayName: data.displayName?.trim() || auth?.currentUser?.displayName || 'Farmer',
    preferredLanguage: data.preferredLanguage || 'en',
    state: data.state || 'Tamil Nadu',
    district: data.district?.trim() || 'Thanjavur',
    locality: data.locality?.trim() || '',
    primaryCrop: data.primaryCrop?.trim() || 'Rice (Paddy)',
    primaryCrops: Array.isArray(data.primaryCrops) && data.primaryCrops.length > 0 ? data.primaryCrops : [data.primaryCrop?.trim() || 'Rice (Paddy)'],
    activeVariety: data.activeVariety?.trim() || 'CR 1009 Sub 1',
    plantingDate: data.plantingDate || '',
    cropStage: data.cropStage || 'Active Tillering (21-45 DAT)',
    landSizeAcres: typeof data.landSizeAcres === 'number' ? data.landSizeAcres : 2.5,
    landSizeArea: typeof data.landSizeArea === 'number' ? data.landSizeArea : (typeof data.landSizeAcres === 'number' ? data.landSizeAcres : 2.5),
    areaUnit: data.areaUnit || 'Acres',
    irrigationMethod: data.irrigationMethod || 'Canal / Cauvery Basin',
    farmNotes: data.farmNotes || '',
    email: data.email || auth?.currentUser?.email || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const persistLocal = (p: FarmerProfile) => {
    try {
      localStorage.setItem(localKey, JSON.stringify(p));
    } catch {}
  };

  if (!isFirebaseConfigured || !db) {
    persistLocal(fallbackProfile);
    return fallbackProfile;
  }

  const path = `profiles/${uid}`;
  const profileRef = doc(db, 'profiles', uid);

  try {
    const existingSnap = await getDoc(profileRef);

    if (existingSnap.exists()) {
      // Update existing profile — use serverTimestamp() only in the Firestore payload
      const updatePayload: Record<string, any> = {
        ...data,
        uid, // Never permit changing the UID
        updatedAt: serverTimestamp(),
      };
      await setDoc(profileRef, updatePayload, { merge: true });
      const merged: FarmerProfile = {
        ...(existingSnap.data() as FarmerProfile),
        ...data,
        uid,
        updatedAt: new Date().toISOString(),
      };
      persistLocal(merged);
      return merged;
    } else {
      // New profile — write to Firestore with FieldValue timestamps in the payload,
      // but keep the in-memory FarmerProfile using ISO strings to satisfy the type.
      const firestorePayload: Record<string, any> = {
        ...fallbackProfile,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(profileRef, firestorePayload);
      // fallbackProfile already has ISO string timestamps — safe to persist locally
      persistLocal(fallbackProfile);
      return fallbackProfile;
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    // Offline resilience: save locally and return fallbackProfile so UI does not fail
    persistLocal(fallbackProfile);
    return fallbackProfile;
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
  const localKey = `cropshield_profile_${uid}`;
  const loadLocal = () => {
    try {
      const cached = localStorage.getItem(localKey);
      return cached ? JSON.parse(cached) : null;
    } catch {
      return null;
    }
  };

  if (!isFirebaseConfigured || !db) {
    onProfile(loadLocal());
    return () => {};
  }

  const path = `profiles/${uid}`;
  return onSnapshot(
    doc(db, 'profiles', uid),
    (snap) => {
      if (snap.exists()) {
        const prof = snap.data() as FarmerProfile;
        try {
          localStorage.setItem(localKey, JSON.stringify(prof));
        } catch {}
        onProfile(prof);
      } else {
        const local = loadLocal();
        onProfile(local);
      }
    },
    (error) => {
      console.warn('Error listening to farmer profile:', error);
      onError?.(error);
      handleFirestoreError(error, OperationType.GET, path);
      // Fallback to local profile on permission/network error
      const local = loadLocal();
      if (local) {
        onProfile(local);
      }
    }
  );
}
