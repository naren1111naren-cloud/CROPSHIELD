import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, doc, getDocFromServer } from 'firebase/firestore';
import { getStorage, FirebaseStorage } from 'firebase/storage';

import appletConfig from '../../firebase-applet-config.json';

const envConfig = {
  apiKey: import.meta.env?.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env?.VITE_FIREBASE_APP_ID,
  firestoreDatabaseId: import.meta.env?.VITE_FIREBASE_FIRESTORE_DATABASE_ID,
};

// Prioritize explicit environment variables if provided, fallback to applet config
const hasEnvConfig = Boolean(envConfig.apiKey && envConfig.projectId && envConfig.projectId !== 'YOUR_PROJECT_ID');
const config: any = hasEnvConfig ? envConfig : (appletConfig && appletConfig.apiKey ? appletConfig : envConfig);

export const isFirebaseConfigured = Boolean(
  config && config.apiKey && config.projectId && config.projectId !== 'remixed-project-id' && config.projectId !== 'YOUR_PROJECT_ID'
);

let app: FirebaseApp | null = null;
let authInstance: Auth | null = null;
let dbInstance: Firestore | null = null;
let storageInstance: FirebaseStorage | null = null;

if (isFirebaseConfigured) {
  try {
    app = getApps().length > 0 ? getApp() : initializeApp(config);
    authInstance = getAuth(app);
    // CRITICAL per skill: pass firestoreDatabaseId if configured
    if (config.firestoreDatabaseId && config.firestoreDatabaseId !== '(default)' && config.firestoreDatabaseId.trim() !== '') {
      dbInstance = getFirestore(app, config.firestoreDatabaseId);
    } else {
      dbInstance = getFirestore(app);
    }
    storageInstance = getStorage(app);
  } catch (err) {
    console.error('Failed to initialize Firebase SDK:', err);
  }
} else {
  console.warn('Firebase configuration is incomplete. Provide configuration via firebase-applet-config.json or environment variables.');
}

export const firebaseApp = app as FirebaseApp;
export const auth = authInstance as Auth;
export const db = dbInstance as Firestore;
export const storage = storageInstance as FirebaseStorage;
export const firebaseConfig = config;

/**
 * Validates connection to Firestore at application boot
 */
export async function validateFirestoreConnection(): Promise<boolean> {
  if (!dbInstance) return false;
  try {
    await getDocFromServer(doc(dbInstance, 'test', 'connection'));
    return true;
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore is offline or check your Firebase configuration.');
      return false;
    }
    // Expected to error or succeed; permission-denied means the cloud endpoint responded!
    return true;
  }
}
