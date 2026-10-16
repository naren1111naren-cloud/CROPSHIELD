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
import { motion, AnimatePresence } from 'motion/react';
import { viewTransitionVariants, pageVariants } from './lib/motion';

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
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.3 }}
          className="flex flex-col items-center gap-4"
        >
          <svg
            className="w-9 h-9 animate-spin text-[#183B2A]"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
          </svg>
          <span className="text-xs font-mono text-[#4A584D] tracking-wider uppercase">Loading CropShield...</span>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F3E9] text-[#17271E] overflow-x-hidden">
      <AnimatePresence mode="wait">
        {currentView === 'signin' && (
          <motion.div
            key="signin-view"
            variants={viewTransitionVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
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
          </motion.div>
        )}

        {currentView === 'home' && (
          <motion.div
            key="home-view"
            variants={viewTransitionVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="flex flex-col min-h-screen pb-16 md:pb-0"
          >
            <Header
              currentView={currentView}
              onNavigate={handleNavigate}
              onOpenAuth={handleOpenAuth}
              onOpenProfile={handleOpenProfile}
            />

            <main className="flex-1">
              {/* 1. Hero with Clear Primary Action: Check Your Crop Health */}
              <HeroSection
                onScanCrop={() => handleNavigate('diagnose')}
                onExploreFarmMap={() => handleNavigate('my-farm')}
                onExplore={() => handleNavigate('my-farm')}
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
            </main>

            {/* Footer */}
            <Footer onNavigate={handleNavigate} />

            {/* Accessible Mobile Bottom Navigation Bar (Android smartphone friendly) */}
            <MobileBottomNav
              currentView={currentView}
              onNavigate={(dest: MainDestination) => handleNavigate(dest)}
            />
          </motion.div>
        )}

        {currentView !== 'signin' && currentView !== 'home' && (
          <motion.div
            key={`dashboard-${currentView}`}
            variants={viewTransitionVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <FarmerDashboard
              initialTab={
                currentView === 'diagnose'
                  ? 'scan'
                  : currentView === 'market-weather'
                  ? 'prices'
                  : currentView === 'my-farm'
                  ? 'farms'
                  : 'overview'
              }
              onBackToHome={() => handleNavigate('home')}
              onOpenProfile={handleOpenProfile}
              onOpenAuth={handleOpenAuth}
            />

            {/* Accessible Mobile Bottom Navigation Bar in Workspace */}
            <MobileBottomNav
              currentView={currentView}
              onNavigate={(dest: MainDestination) => handleNavigate(dest)}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Global Modals (rendered outside view transitions for uninterrupted presence) */}
      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authModalMode}
        onSuccess={() => {
          setAuthModalOpen(false);
          if (currentView === 'signin') {
            setCurrentView('diagnose');
          }
        }}
      />

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
