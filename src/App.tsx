import React, { useState } from 'react';
import { LanguageProvider } from './context/LanguageContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/layout/Header';
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

function MainApp() {
  const { user, profile, isLoading, isProfileComplete } = useAuth();
  const [currentView, setCurrentView] = useState<'home' | 'dashboard'>('home');
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalMode, setAuthModalMode] = useState<'signin' | 'register'>('signin');
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [hasPromptedInitialSetup, setHasPromptedInitialSetup] = useState(false);

  // Guide user through profile setup after first login/registration if incomplete
  React.useEffect(() => {
    if (user && !isLoading && !isProfileComplete && !hasPromptedInitialSetup) {
      setProfileModalOpen(true);
      setHasPromptedInitialSetup(true);
    }
  }, [user, isLoading, isProfileComplete, hasPromptedInitialSetup]);

  const handleOpenAuth = (mode: 'signin' | 'register' = 'signin') => {
    setAuthModalMode(mode);
    setAuthModalOpen(true);
  };

  const handleOpenProfile = () => {
    setProfileModalOpen(true);
  };

  const handleNavigateToDashboard = () => {
    if (!user) {
      // Protected farmer dashboard route: prompt sign in first
      setAuthModalMode('signin');
      setAuthModalOpen(true);
    } else {
      setCurrentView('dashboard');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const handleNavigate = (view: 'home' | 'dashboard', sectionId?: string) => {
    if (view === 'dashboard') {
      handleNavigateToDashboard();
      return;
    }

    setCurrentView('home');
    if (sectionId) {
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

  // If user signs out while on dashboard, return to home
  React.useEffect(() => {
    if (!user && currentView === 'dashboard') {
      setCurrentView('home');
    }
  }, [user, currentView]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F7F6EF] text-[#202B22] overflow-x-hidden">
      <Header
        currentView={currentView}
        onNavigate={handleNavigate}
        onOpenAuth={handleOpenAuth}
        onOpenProfile={handleOpenProfile}
      />

      <main className="flex-1">
        {currentView === 'home' ? (
          <>
            {/* 1. Hero with Clear Purpose & Primary Scan Action */}
            <HeroSection
              onScanCrop={handleNavigateToDashboard}
              onExplore={() => {
                const el = document.getElementById('how-it-works');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
            />

            {/* 2. How it works: 4-step protocol */}
            <SectionProcess />

            {/* 3. The field, observed: Why early observation matters */}
            <SectionObserved />

            {/* 4. Disease intelligence: Common Tamil Nadu rice diseases */}
            <SectionDiseaseIntelligence
              onLaunchScanner={handleNavigateToDashboard}
            />

            {/* 5. Local field intelligence: District weather & risk registry */}
            <SectionLocalRisk
              onOpenDashboard={handleNavigateToDashboard}
            />

            {/* 6. A network of field observations: Verified community alerts */}
            <SectionNetwork
              onOpenAlerts={handleNavigateToDashboard}
            />

            {/* 7. Built for the field: Tamil, mobile ergonomics, offline resilience */}
            <SectionBuiltForField />

            {/* 8. Closing call to action: Deep forest green canvas */}
            <SectionCTA
              onGetStarted={handleNavigateToDashboard}
              onExplore={() => {
                const el = document.getElementById('disease-intelligence');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
            />
          </>
        ) : (
          <FarmerDashboard
            onBackToHome={() => handleNavigate('home')}
            onOpenProfile={handleOpenProfile}
          />
        )}
      </main>

      {/* 9. Footer with disclaimers & extension contacts */}
      <Footer onNavigate={handleNavigate} />

      {/* Auth Modal (Sign In / Register / Reset Password) */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
        onSuccess={() => {
          setCurrentView('dashboard');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />

      {/* Farmer Profile Modal (Cadastral Info, District, Variety, Land Size) */}
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
