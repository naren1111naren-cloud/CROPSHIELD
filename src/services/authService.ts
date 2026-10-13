import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  User,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp, getDoc } from 'firebase/firestore';
import { auth, db, isFirebaseConfigured } from '../lib/firebase';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';
import { FarmerProfile } from '../types';
import { saveFarmerProfile } from './profileService';

export interface RegisterParams {
  email: string;
  password: string;
  displayName: string;
  preferredLanguage: 'en' | 'ta';
  district: string;
  locality?: string;
  activeVariety?: string;
  plantingDate?: string;
  cropStage?: string;
}

export function formatAuthError(errorCode: string, lang: 'en' | 'ta' = 'en'): string {
  const isTa = lang === 'ta';
  switch (errorCode) {
    case 'auth/email-already-in-use':
      return isTa
        ? 'இந்த மின்னஞ்சல் முகவரியில் ஏற்கனவே ஒரு கணக்கு உள்ளது.'
        : 'An account with this email address already exists.';
    case 'auth/invalid-email':
      return isTa
        ? 'சரியான மின்னஞ்சல் முகவரியை உள்ளிடவும்.'
        : 'Please enter a valid email address.';
    case 'auth/weak-password':
      return isTa
        ? 'கடவுச்சொல் குறைந்தபட்சம் 6 எழுத்துகள் கொண்டிருக்க வேண்டும்.'
        : 'Password should be at least 6 characters.';
    case 'auth/user-not-found':
      return isTa
        ? 'இந்த மின்னஞ்சலில் எந்தக் கணக்கும் பதிவு செய்யப்படவில்லை.'
        : 'No account found with this email address.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return isTa
        ? 'தவறான மின்னஞ்சல் அல்லது கடவுச்சொல். சரிபார்க்கவும்.'
        : 'Incorrect email or password. Please try again.';
    case 'auth/too-many-requests':
      return isTa
        ? 'அதிக முயற்சிகள் மேற்கொள்ளப்பட்டன. சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும்.'
        : 'Too many attempts. Please wait a moment and try again.';
    case 'auth/network-request-failed':
      return isTa
        ? 'இணைய இணைப்பு துண்டிக்கப்பட்டுள்ளது. சரிபார்க்கவும்.'
        : 'Network connection failed. Please check your internet connection.';
    default:
      return isTa
        ? 'அங்கீகாரப் பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.'
        : 'An authentication error occurred. Please try again.';
  }
}

/**
 * Register a new farmer and create their profile in Firestore
 */
export async function registerFarmer(params: RegisterParams): Promise<User> {
  if (!isFirebaseConfigured || !auth) {
    throw new Error('Firebase configuration is not available.');
  }

  const { email, password, displayName, preferredLanguage, district, locality, activeVariety, plantingDate, cropStage } = params;

  // 1. Create Auth User
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // 2. Set Display Name on Auth Profile
  try {
    await updateProfile(user, { displayName });
  } catch (err) {
    console.warn('Failed to update display name on Auth user:', err);
  }

  // 3. Create or update Firestore Profile Document using profileService
  try {
    await saveFarmerProfile(user.uid, {
      uid: user.uid,
      displayName,
      email: user.email || '',
      preferredLanguage: preferredLanguage || 'en',
      district: district || 'Thanjavur',
      locality: locality || '',
      primaryCrop: 'Rice (Paddy)',
      activeVariety: activeVariety || 'CR 1009 Sub 1',
      plantingDate: plantingDate || '',
      cropStage: cropStage || 'Tillering',
      landSizeAcres: 4.5,
    });
  } catch (error) {
    console.error('Initial profile creation failed:', error);
    // User account was created in Auth; let the user complete/retry profile setup in UI
  }

  return user;
}

/**
 * Sign in an existing farmer
 */
export async function signInFarmer(email: string, password: string): Promise<User> {
  if (!isFirebaseConfigured || !auth) {
    throw new Error('Firebase configuration is not available.');
  }
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

/**
 * Sign out current farmer
 */
export async function signOutFarmer(): Promise<void> {
  if (!auth) return;
  await signOut(auth);
}

/**
 * Send password reset email
 */
export async function sendFarmerPasswordReset(email: string): Promise<void> {
  if (!auth) return;
  await sendPasswordResetEmail(auth, email);
}
