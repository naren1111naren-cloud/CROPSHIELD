import React, { useState, useEffect } from 'react';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header, AppNavView } from './components/layout/Header';
import { MobileBottomNav, MainDestination } from './components/layout/MobileBottomNav';
import { HeroSection } from './components/home/HeroSection';
import { SectionProcess } from './components/home/SectionProcess';
import { SectionObserved } from './components/home/SectionObserved';
import { SectionDiseaseIntelligence } from './components/home/SectionDiseaseIntelligence';
import { SectionLocalRisk } from './components/home/SectionLocalRisk';
import { SectionNetwork } from './components/home/SectionNetwork';
import { SectionBuiltForField } from './components/home/SectionBuiltForField';
import { SectionCTA } from './components/home/SectionCTA';
import { Footer } from './components/layout/Footer';
import { FarmerDashboard } from './components/dashboard/FarmerDashboard';
import { AuthModal } from './components/auth/AuthModal';
import { FarmerProfileModal } from './components/auth/FarmerProfileModal';
import { SignInPage } from './components/auth/SignInPage';
import { checkBackendHealth } from './lib/apiClient';

function MainApp() {
  const { user, profile, isLoading, isProfileComplete } = useAuth();
  const [currentView, setCurrentView] = useState<AppNavView>('home');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'register'>('signin');
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [hasPromptedInitialSetup, setHasPromptedInitialSetup] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'connecting' | 'online' | 'offline'>('connecting');

  // Background health check on initial mount to wake sleeping Render instance early
  useEffect(() => {
    let isMounted = true;
    checkBackendHealth().then((health) => {
      if (isMounted) {
        setBackendStatus(health.ok ? 'online' : 'offline');
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Guide user through profile setup after first login/registration if incomplete
  useEffect(() => {
    if (user && !isLoading && !isProfileComplete && !hasPromptedInitialSetup) {
      setProfileModalOpen(true);
      setHasPromptedInitialSetup(true);
    }
  }, [user, isLoading, isProfileComplete, hasPromptedInitialSetup]);

  const handleOpenAuth = (mode: 'signin' | 'register' = 'signin') => {
    if (mode === 'signin') {
      setCurrentView('signin');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      setAuthModalMode('register');
      setAuthModalOpen(true);
    }
  };

  const handleOpenProfile = () => {
    setProfileModalOpen(true);
  };

  const handleNavigate = (view: AppNavView, sectionId?: string) => {
    if (view === 'signin') {
      setCurrentView('signin');
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }

    setCurrentView(view);

    if (view === 'home' && sectionId) {
      setTimeout(() => {
        const el = document.getElementById(sectionId);
        if (el) {
          el.scrollIntoView({ behavior: 'smooth' });
        }
      }, 50);
    } else {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // If user signs in while on signin page, route immediately to diagnose
  useEffect(() => {
    if (user && currentView === 'signin') {
      setCurrentView('diagnose');
    }
  }, [user]);

  // Loading state while Firebase is initializing
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#F7F6EF] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <svg
            className="w-8 h-8 animate-spin text-[#183B2A]"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <span className="text-xs font-mono text-[#4A584D] tracking-wider uppercase">Loading CropShield...</span>
        </div>
      </div>
    );
  }

  if (currentView === 'signin') {
    return (
      <>
        <SignInPage
          onSuccess={() => {
            setCurrentView('diagnose');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onExploreGuest={() => {
            setCurrentView('home');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
          onOpenRegister={() => {
            setAuthModalMode('register');
            setAuthModalOpen(true);
          }}
        />

        <AuthModal
          isOpen={authModalOpen}
          onClose={() => setAuthModalOpen(false)}
          initialMode={authModalMode}
          onSuccess={() => {
            setCurrentView('diagnose');
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }}
        />

        <FarmerProfileModal
          isOpen={profileModalOpen}
          onClose={() => setProfileModalOpen(false)}
          isInitialSetup={!isProfileComplete}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F6EF] text-[#202B22] overflow-x-hidden pb-16 md:pb-0">
      <Header
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenAuth={handleOpenAuth}
        onOpenProfile={handleOpenProfile}
      />

      <main className="flex-1">
        {currentView === 'home' && (
          <>
            {/* 1. Hero with Clear Primary Action: Check Your Crop Health */}
            <HeroSection
              onScanCrop={() => handleNavigate('diagnose')}
              onExplore={() => {
                const el = document.getElementById('how-it-works');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            {/* 2. 4-step protocol for field action */}
            <SectionProcess />

            {/* 3. The field, observed: Why early observation matters */}
            <SectionObserved />

            {/* 4. Disease intelligence: Tamil Nadu rice and cash crops */}
            <SectionDiseaseIntelligence
              onLaunchScanner={() => handleNavigate('diagnose')}
            />

            {/* 5. Local field intelligence: District weather & risk registry */}
            <SectionLocalRisk
              onOpenDashboard={() => handleNavigate('market-weather')}
            />

            {/* 6. A network of field observations: Verified community alerts */}
            <SectionNetwork
              onOpenAlerts={() => handleNavigate('market-weather')}
            />

            {/* 7. Built for the field: Tamil, mobile ergonomics, offline resilience */}
            <SectionBuiltForField />

            {/* 8. Closing call to action: Deep forest green canvas */}
            <SectionCTA
              onGetStarted={() => handleNavigate('diagnose')}
              onExplore={() => {
                const el = document.getElementById('disease-intelligence');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
            />
          </>
        )}

        {/* Destination 2: Diagnose (Foliage Photo Upload, AI Analysis, TNAU Care Protocols) */}
        {(currentView === 'diagnose' || currentView === 'dashboard') && (
          <FarmerDashboard
            initialTab="scan"
            onBackToHome={() => handleNavigate('home')}
            onOpenProfile={handleOpenProfile}
            onOpenAuth={handleOpenAuth}
          />
        )}

        {/* Destination 3: Market & Weather (Live Mandi Prices + 5-Day Forecast + District Risks) */}
        {currentView === 'market-weather' && (
          <FarmerDashboard
            initialTab="prices"
            onBackToHome={() => handleNavigate('home')}
            onOpenProfile={handleOpenProfile}
            onOpenAuth={handleOpenAuth}
          />
        )}

        {/* Destination 4: My Farm (Saved Inspections, Farm Parcels, Guidance, Expert Directory) */}
        {currentView === 'my-farm' && (
          <FarmerDashboard
            initialTab={user ? 'farms' : 'history'}
            onBackToHome={() => handleNavigate('home')}
            onOpenProfile={handleOpenProfile}
            onOpenAuth={handleOpenAuth}
          />
        )}
      </main>

      {/* Footer */}
      <Footer onNavigate={handleNavigate} />

      {/* Accessible Mobile Bottom Navigation Bar (Android smartphone friendly) */}
      <MobileBottomNav
        currentView={currentView}
        onNavigate={(dest: MainDestination) => handleNavigate(dest)}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
        onSuccess={() => {
          setAuthModalOpen(false);
        }}
      />

      {/* Farmer Profile Modal */}
      <FarmerProfileModal
        isOpen={profileModalOpen}
        onClose={() => setProfileModalOpen(false)}
        isInitialSetup={!isProfileComplete}
      />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <MainApp />
      </AuthProvider>
    </LanguageProvider>
  );
}
