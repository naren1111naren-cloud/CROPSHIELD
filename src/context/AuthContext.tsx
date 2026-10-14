import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { auth, isFirebaseConfigured, validateFirestoreConnection } from '../lib/firebase';
import {
  registerFarmer,
  signInFarmer,
  signOutFarmer,
  sendFarmerPasswordReset,
  RegisterParams,
} from '../services/authService';
import { subscribeFarmerProfile, saveFarmerProfile, updateFarmerProfile } from '../services/profileService';
import { FarmerProfile } from '../types';

interface AuthContextType {
  user: User | null;
  profile: FarmerProfile | null;
  isLoading: boolean;
  isConfigured: boolean;
  isProfileComplete: boolean;
  register: (params: RegisterParams) => Promise<User>;
  signIn: (email: string, pass: string) => Promise<User>;
  signOut: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  updateProfile: (data: Partial<FarmerProfile>) => Promise<FarmerProfile>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<FarmerProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isConfigured] = useState<boolean>(isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setIsLoading(false);
      return;
    }

    // Validate Firestore connection on boot safely without throwing
    validateFirestoreConnection().catch((err) => {
      console.warn('Firestore connection check notice:', err);
    });

    // Persistent authentication listener
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setProfile(null);
        setIsLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, [isConfigured]);

  // Subscribe to farmer profile when user is authenticated
  useEffect(() => {
    if (!user) {
      setProfile(null);
      return;
    }

    const unsubscribeProfile = subscribeFarmerProfile(
      user.uid,
      (loadedProfile) => {
        setProfile(loadedProfile);
        setIsLoading(false);
      },
      (err) => {
        console.warn('Profile subscription error, utilizing offline farmer profile fallback:', err);
        setProfile((prev) => prev || {
          uid: user.uid,
          displayName: user.displayName || user.email?.split('@')[0] || 'Farmer',
          email: user.email || '',
          preferredLanguage: 'en',
          district: 'Thanjavur',
          primaryCrop: 'Rice (Paddy)',
          activeVariety: 'CR 1009 Sub 1',
          cropStage: 'Active Tillering (21-45 DAT)',
          landSizeAcres: 2.5,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
        setIsLoading(false);
      }
    );

    return () => unsubscribeProfile();
  }, [user]);

  const register = async (params: RegisterParams) => {
    const newUser = await registerFarmer(params);
    return newUser;
  };

  const signIn = async (email: string, pass: string) => {
    const signedInUser = await signInFarmer(email, pass);
    return signedInUser;
  };

  const handleSignOut = async () => {
    await signOutFarmer();
    setUser(null);
    setProfile(null);
  };

  const resetPassword = async (email: string) => {
    await sendFarmerPasswordReset(email);
  };

  const handleUpdateProfile = async (data: Partial<FarmerProfile>): Promise<FarmerProfile> => {
    if (!user) throw new Error('User is not authenticated.');
    const saved = await saveFarmerProfile(user.uid, data);
    setProfile(saved);
    return saved;
  };

  const isProfileComplete = Boolean(
    profile && profile.displayName?.trim() && profile.district?.trim()
  );

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        isConfigured,
        isProfileComplete,
        register,
        signIn,
        signOut: handleSignOut,
        resetPassword,
        updateProfile: handleUpdateProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
