import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updateProfile,
  GoogleAuthProvider,
  signInWithPopup,
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
        ? 'இந்த மின்னஞ்சல் முகவரியில் ஏற்கனவே ஒரு கணக்கு உள்ளது. தயவுசெய்து உள்நுழையவும்.'
        : 'An account with this email address already exists. Please switch to Sign In.';
    case 'auth/invalid-email':
      return isTa
        ? 'சரியான மின்னஞ்சல் முகவரியை உள்ளிடவும்.'
        : 'Please enter a valid email address.';
    case 'auth/weak-password':
      return isTa
        ? 'கடவுச்சொல் குறைந்தபட்சம் 6 எழுத்துகள் கொண்டிருக்க வேண்டும்.'
        : 'Password must be at least 6 characters.';
    case 'auth/user-not-found':
      return isTa
        ? 'இந்த மின்னஞ்சலில் எந்தக் கணக்கும் பதிவு செய்யப்படவில்லை. "புதிய பதிவு" தாவலைத் தேர்ந்தெடுத்து கணக்கை உருவாக்கவும்.'
        : 'No farmer account found with this email. Please switch to the Register tab to create an account.';
    case 'auth/wrong-password':
    case 'auth/invalid-credential':
      return isTa
        ? 'தவறான மின்னஞ்சல் அல்லது கடவுச்சொல். நீங்கள் புதிய விவசாயி எனில், "புதிய பதிவு" தாவலைத் தேர்ந்தெடுத்து கணக்கை உருவாக்கவும்.'
        : 'Incorrect email or password. If you have not registered yet, please switch to the Register tab to create an account.';
    case 'auth/too-many-requests':
      return isTa
        ? 'அதிக முயற்சிகள் மேற்கொள்ளப்பட்டன. சிறிது நேரம் கழித்து மீண்டும் முயற்சிக்கவும் அல்லது கடவுச்சொல்லை மீட்டமைக்கவும்.'
        : 'Too many failed login attempts. Access is temporarily paused for security. Please wait a moment or use "Forgot password?".';
    case 'auth/network-request-failed':
      return isTa
        ? 'இணைய இணைப்பு துண்டிக்கப்பட்டுள்ளது. உங்கள் இணைய இணைப்பைச் சரிபார்க்கவும்.'
        : 'Network connection failed. Please check your internet connection.';
    case 'auth/user-disabled':
      return isTa
        ? 'இந்த விவசாயி கணக்கு முடக்கப்பட்டுள்ளது.'
        : 'This farmer account has been disabled. Please contact agricultural extension support.';
    case 'auth/operation-not-allowed':
      return isTa
        ? 'மின்னஞ்சல்/கடவுச்சொல் அங்கீகாரம் தற்போது இயக்கப்படவில்லை.'
        : 'Email/Password sign-in is not enabled for this project. Please check Firebase authentication configuration.';
    case 'missing-fields':
      return isTa
        ? 'அனைத்து தேவையான விவரங்களையும் நிரப்பவும்.'
        : 'Please fill in all required fields.';
    case 'passwords-mismatch':
      return isTa
        ? 'கடவுச்சொற்கள் பொருந்தவில்லை.'
        : 'Passwords do not match.';
    case 'missing-email':
      return isTa
        ? 'மின்னஞ்சல் முகவரியை உள்ளிடவும்.'
        : 'Please enter your email address.';
    case 'auth/popup-closed-by-user':
      return isTa
        ? 'கூகிள் உள்நுழைவு சாளரம் மூடப்பட்டது. தயவுசெய்து மீண்டும் முயற்சிக்கவும்.'
        : 'Google sign-in popup was closed before completing. Please try again.';
    case 'auth/popup-blocked':
      return isTa
        ? 'உங்கள் உலாவியில் சாளரம் (Popup) தடுக்கப்பட்டுள்ளது. தயவுசெய்து அனுமதித்து மீண்டும் முயற்சிக்கவும்.'
        : 'Sign-in popup was blocked by browser. Please allow popups for this site.';
    case 'auth/account-exists-with-different-credential':
      return isTa
        ? 'இந்த மின்னஞ்சலில் ஏற்கனவே வேறு உள்நுழைவு முறை மூலம் கணக்கு உள்ளது.'
        : 'An account already exists with the same email using a different sign-in method.';
    case 'auth/cancelled-popup-request':
      return isTa
        ? 'உள்நுழைவு கோரிக்கை ரத்து செய்யப்பட்டது.'
        : 'Sign-in request was cancelled. Please try again.';
    case 'config-missing':
      return isTa
        ? 'Firebase அங்கீகாரக் கட்டமைப்பு முழுமையடையவில்லை.'
        : 'Firebase authentication configuration is missing or incomplete.';
    default:
      return isTa
        ? 'அங்கீகாரப் பிழை ஏற்பட்டது. மீண்டும் முயற்சிக்கவும்.'
        : 'An authentication error occurred. Please verify your credentials and try again.';
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

/**
 * Sign in using Google Auth Provider
 */
export async function signInWithGoogle(): Promise<User> {
  if (!isFirebaseConfigured || !auth) {
    throw new Error('config-missing');
  }
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: 'select_account' });
  const result = await signInWithPopup(auth, provider);
  const user = result.user;

  // Auto-sync or seed initial farmer profile in Firestore if first-time user
  if (db) {
    try {
      const profileSnap = await getDoc(doc(db, 'farmers', user.uid));
      if (!profileSnap.exists()) {
        await saveFarmerProfile(user.uid, {
          uid: user.uid,
          displayName: user.displayName || user.email?.split('@')[0] || 'Farmer',
          email: user.email || '',
          preferredLanguage: 'en',
          district: 'Thanjavur',
          locality: '',
          primaryCrop: 'Rice (Paddy)',
          activeVariety: 'CR 1009 Sub 1',
          cropStage: 'Active Tillering (21-45 DAT)',
          landSizeAcres: 4.5,
        });
      }
    } catch (profileErr) {
      console.warn('Profile sync on Google sign in notice:', profileErr);
    }
  }

  return user;
}
