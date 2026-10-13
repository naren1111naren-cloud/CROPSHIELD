import {
  collection,
  addDoc,
  getDocs,
  query,
  where,
  orderBy,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db, isFirebaseConfigured } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';
import { CommunityReport } from '../types';

export interface NewFieldReportParams {
  submittedBy: string;
  farmerName: string;
  village: string;
  district: string;
  variety: string;
  growthStage: string;
  suspectedCondition: string;
  suspectedConditionTamil?: string;
  fieldNotes: string;
  imagePath?: string;
}

export async function submitCommunityReport(params: NewFieldReportParams): Promise<string> {
  if (!isFirebaseConfigured || !db) {
    throw new Error('Firestore is not configured.');
  }

  const path = 'fieldReports';
  try {
    const colRef = collection(db, 'fieldReports');
    const docRef = await addDoc(colRef, {
      submittedBy: params.submittedBy,
      farmerName: params.farmerName || 'Anonymous Farmer',
      village: params.village,
      district: params.district,
      variety: params.variety || 'CR 1009 Sub 1',
      growthStage: params.growthStage || 'Tillering',
      suspectedCondition: params.suspectedCondition,
      suspectedConditionTamil: params.suspectedConditionTamil || params.suspectedCondition,
      description: params.fieldNotes,
      imagePath: params.imagePath || '',
      verificationStatus: 'Pending Field Review',
      verificationStatusTamil: 'நேரடி ஆய்வு நிலுவையில் உள்ளது',
      riskLevel: 'Moderate',
      createdAt: serverTimestamp(),
      reviewedAt: null,
      latitude: 10.78 + (Math.random() - 0.5) * 0.08,
      longitude: 79.13 + (Math.random() - 0.5) * 0.08,
    });
    return docRef.id;
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, path);
  }
}

export function subscribeCommunityReports(
  districtFilter: string = 'all',
  onReports: (reports: CommunityReport[]) => void,
  onError?: (err: any) => void
): () => void {
  if (!isFirebaseConfigured || !db) {
    onReports([]);
    return () => {};
  }

  const path = 'fieldReports';
  const colRef = collection(db, 'fieldReports');
  let q = query(colRef, orderBy('createdAt', 'desc'));
  if (districtFilter !== 'all') {
    q = query(colRef, where('district', '==', districtFilter), orderBy('createdAt', 'desc'));
  }

  return onSnapshot(
    q,
    (snapshot) => {
      const results: CommunityReport[] = [];
      snapshot.forEach((docSnap) => {
        const d = docSnap.data();
        results.push({
          id: docSnap.id,
          farmerName: d.farmerName || 'Farmer',
          village: d.village || '',
          district: d.district || '',
          variety: d.variety || '',
          growthStage: d.growthStage || '',
          suspectedCondition: d.suspectedCondition || '',
          suspectedConditionTamil: d.suspectedConditionTamil || d.suspectedCondition || '',
          verificationStatus: d.verificationStatus || 'Pending Field Review',
          verificationStatusTamil: d.verificationStatusTamil || 'நேரடி ஆய்வு நிலுவையில் உள்ளது',
          reportedDate: d.createdAt?.toDate ? d.createdAt.toDate().toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          fieldNotes: d.description || '',
          riskLevel: d.riskLevel || 'Moderate',
          latitude: d.latitude || 10.78,
          longitude: d.longitude || 79.13,
        });
      });
      onReports(results);
    },
    (error) => {
      console.error('Error listening to fieldReports:', error);
      onError?.(error);
      handleFirestoreError(error, OperationType.LIST, path);
    }
  );
}
