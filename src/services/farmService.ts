import {
  collection,
  doc,
  addDoc,
  getDocs,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  writeBatch,
} from 'firebase/firestore';
import { db, isFirebaseConfigured, auth } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';
import { FarmRecord } from '../types';

/**
 * Validates that the caller is operating on their own authenticated profile
 */
function assertOwner(uid: string) {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firestore is not configured.');
  }
  if (!uid || (auth?.currentUser && auth.currentUser.uid !== uid)) {
    throw new Error('Unauthorized: cannot access farms belonging to another user.');
  }
}

/**
 * Fetch all farms for an authenticated farmer
 */
export async function getFarms(uid: string): Promise<FarmRecord[]> {
  assertOwner(uid);
  if (!db) return [];

  const path = `profiles/${uid}/farms`;
  try {
    const farmsColRef = collection(db, 'profiles', uid, 'farms');
    const q = query(farmsColRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    const results: FarmRecord[] = [];
    snapshot.forEach((snapDoc) => {
      results.push({ id: snapDoc.id, ...(snapDoc.data() as FarmRecord) });
    });
    return results;
  } catch (error) {
    handleFirestoreError(error, OperationType.LIST, path);
    throw error;
  }
}

/**
 * Real-time listener for farmer's farm records
 */
export function subscribeFarms(
  uid: string,
  onFarms: (farms: FarmRecord[]) => void,
  onError?: (err: any) => void
): () => void {
  if (!isFirebaseConfigured || !db || !uid) {
    onFarms([]);
    return () => {};
  }

  const path = `profiles/${uid}/farms`;
  const farmsColRef = collection(db, 'profiles', uid, 'farms');
  const q = query(farmsColRef, orderBy('createdAt', 'desc'));

  return onSnapshot(
    q,
    (snapshot) => {
      const results: FarmRecord[] = [];
      snapshot.forEach((snapDoc) => {
        results.push({ id: snapDoc.id, ...(snapDoc.data() as FarmRecord) });
      });
      onFarms(results);
    },
    (error) => {
      console.error('Error listening to farms:', error);
      onError?.(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}

/**
 * Create a new farm in profiles/{uid}/farms/{farmId}
 */
export async function createFarm(
  uid: string,
  farmData: Omit<FarmRecord, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  assertOwner(uid);
  if (!db) throw new Error('Firestore not initialized');

  if (!farmData.farmName || farmData.farmName.trim().length === 0) {
    throw new Error('Farm name is required.');
  }
  if (!farmData.district || farmData.district.trim().length === 0) {
    throw new Error('District is required.');
  }

  const path = `profiles/${uid}/farms`;
  try {
    const farmsColRef = collection(db, 'profiles', uid, 'farms');

    // Check if any existing farms exist. If none, this farm becomes primary automatically.
    const existingFarms = await getDocs(farmsColRef);
    const shouldBePrimary = farmData.isPrimary ?? (existingFarms.empty);

    const payload: FarmRecord = {
      farmName: farmData.farmName.trim(),
      cropType: farmData.cropType?.trim() || 'Rice (Paddy)',
      riceVariety: farmData.riceVariety?.trim() || 'CR 1009 Sub 1',
      district: farmData.district.trim(),
      locality: farmData.locality?.trim() || '',
      plantingDate: farmData.plantingDate || '',
      cropStage: farmData.cropStage || 'Active Tillering (21-45 DAT)',
      landSizeAcres: typeof farmData.landSizeAcres === 'number' ? farmData.landSizeAcres : 2.5,
      landSizeArea: typeof farmData.landSizeArea === 'number' ? farmData.landSizeArea : (typeof farmData.landSizeAcres === 'number' ? farmData.landSizeAcres : 2.5),
      areaUnit: farmData.areaUnit || 'Acres',
      irrigationMethod: farmData.irrigationMethod || 'Canal / Cauvery Basin',
      isPrimary: shouldBePrimary,
      notes: farmData.notes?.trim() || '',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };

    const docRef = await addDoc(farmsColRef, payload);

    // If marked primary, update profile primaryFarmId and sync crop details
    if (shouldBePrimary) {
      await setPrimaryFarm(uid, docRef.id);
    }

    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
    throw error;
  }
}

/**
 * Update an existing farm in profiles/{uid}/farms/{farmId}
 */
export async function updateFarm(
  uid: string,
  farmId: string,
  farmData: Partial<FarmRecord>
): Promise<void> {
  assertOwner(uid);
  if (!db) throw new Error('Firestore not initialized');

  const path = `profiles/${uid}/farms/${farmId}`;
  try {
    const farmRef = doc(db, 'profiles', uid, 'farms', farmId);
    const updatePayload: Record<string, any> = {
      ...farmData,
      updatedAt: serverTimestamp(),
    };
    delete updatePayload.id;
    delete updatePayload.createdAt;

    await updateDoc(farmRef, updatePayload);

    // If primary status was set, ensure others are un-primary
    if (farmData.isPrimary) {
      await setPrimaryFarm(uid, farmId);
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
}

/**
 * Delete a farm parcel
 */
export async function deleteFarm(uid: string, farmId: string): Promise<void> {
  assertOwner(uid);
  if (!db) throw new Error('Firestore not initialized');

  const path = `profiles/${uid}/farms/${farmId}`;
  try {
    const farmRef = doc(db, 'profiles', uid, 'farms', farmId);
    await deleteDoc(farmRef);
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
    throw error;
  }
}

/**
 * Set a farm as the farmer's primary active plot
 */
export async function setPrimaryFarm(uid: string, farmId: string): Promise<void> {
  assertOwner(uid);
  if (!db) throw new Error('Firestore not initialized');

  const path = `profiles/${uid}/farms`;
  try {
    const farmsColRef = collection(db, 'profiles', uid, 'farms');
    const snapshot = await getDocs(farmsColRef);
    const batch = writeBatch(db);

    let targetFarm: FarmRecord | null = null;

    snapshot.forEach((snapDoc) => {
      const isTarget = snapDoc.id === farmId;
      const farmData = snapDoc.data() as FarmRecord;
      if (isTarget) {
        targetFarm = farmData;
        batch.update(snapDoc.ref, {
          isPrimary: true,
          updatedAt: serverTimestamp(),
        });
      } else if (farmData.isPrimary) {
        batch.update(snapDoc.ref, {
          isPrimary: false,
          updatedAt: serverTimestamp(),
        });
      }
    });

    // Also update parent farmer profile with active variety, district, stage, and primaryFarmId
    if (targetFarm) {
      const profileRef = doc(db, 'profiles', uid);
      batch.update(profileRef, {
        primaryFarmId: farmId,
        activeVariety: (targetFarm as FarmRecord).riceVariety || 'CR 1009 Sub 1',
        district: (targetFarm as FarmRecord).district || 'Thanjavur',
        locality: (targetFarm as FarmRecord).locality || '',
        cropStage: (targetFarm as FarmRecord).cropStage || 'Active Tillering (21-45 DAT)',
        plantingDate: (targetFarm as FarmRecord).plantingDate || '',
        updatedAt: serverTimestamp(),
      });
    }

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, path);
    throw error;
  }
}

/**
 * Convenient quick updater for planting date and crop stage
 */
export async function updateFarmCropStage(
  uid: string,
  farmId: string,
  plantingDate?: string,
  cropStage?: string
): Promise<void> {
  const updates: Partial<FarmRecord> = {};
  if (plantingDate !== undefined) updates.plantingDate = plantingDate;
  if (cropStage !== undefined) updates.cropStage = cropStage;
  await updateFarm(uid, farmId, updates);
}
