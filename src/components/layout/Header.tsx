import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { CropShieldLogo } from '../brand/CropShieldLogo';
import {
  Menu,
  X,
  User,
  Camera,
  ArrowRight,
  TrendingUp,
  BookOpen,
  Compass,
  Layers
} from 'lucide-react';

export type AppNavView = 'home' | 'diagnose' | 'market-weather' | 'my-farm' | 'dashboard' | 'signin';

interface HeaderProps {
  currentView: AppNavView;
  onNavigate: (view: AppNavView, sectionId?: string) => void;
  onOpenAuth: (mode?: 'signin' | 'register') => void;
  onOpenProfile: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentView,
  onNavigate,
  onOpenAuth,
  onOpenProfile,
}) => {
  const { language, setLanguage, t } = useLanguage();
  const { user, profile } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const isTa = language === 'ta';
  const isLanding = currentView === 'home';

  const handleScrollToSection = (sectionId: string) => {
    setMobileMenuOpen(false);
    if (currentView !== 'home') {
      onNavigate('home', sectionId);
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-[#F5F3E9]/95 backdrop-blur-md border-b border-[#DCE4D9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
        {/* Zone 1: CropShield AI Wordmark & Logo */}
        <button
          onClick={() => onNavigate('home')}
          className="cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#1F6B4A] rounded-[8px] shrink-0 py-1"
          aria-label="CropShield AI Home"
        >
          <CropShieldLogo size="sm" />
        </button>

        {/* Zone 2: Navigation Links */}
        {isLanding ? (
          /* Landing Page Navigation: Features, Crop Diagnosis, Market Insights, About */
          <nav
            className="hidden md:flex items-center gap-6 text-[15px] font-medium text-[#17271E]"
            aria-label="Landing Navigation"
          >
            <button
              onClick={() => handleScrollToSection('how-it-works')}
              className="text-[#52665A] hover:text-[#1F6B4A] transition-colors cursor-pointer"
            >
              {t('navFeatures')}
            </button>
            <button
              onClick={() => onNavigate('diagnose')}
              className="text-[#52665A] hover:text-[#1F6B4A] transition-colors cursor-pointer"
            >
              {t('navCropDiagnosis')}
            </button>
            <button
              onClick={() => onNavigate('market-weather')}
              className="text-[#52665A] hover:text-[#1F6B4A] transition-colors cursor-pointer"
            >
              {t('navMarketInsights')}
            </button>
            <button
              onClick={() => handleScrollToSection('built-for-field')}
              className="text-[#52665A] hover:text-[#1F6B4A] transition-colors cursor-pointer"
            >
              {t('navAbout')}
            </button>
          </nav>
        ) : (
          /* Application Workspace Breadcrumbs */
          <div className="hidden md:flex items-center gap-3">
            <span className="text-xs font-semibold uppercase tracking-wider text-[#1F6B4A] bg-[#EAEFE5] px-2.5 py-1 rounded-[6px]">
              {currentView === 'diagnose' || currentView === 'dashboard'
                ? (isTa ? 'பயிர் ஆய்வு பணியகம்' : 'Crop Diagnosis')
                : currentView === 'market-weather'
                ? (isTa ? 'சந்தை நுண்ணறிவு' : 'Market Prices & Weather')
                : (isTa ? 'என் பண்ணைகள்' : 'My Farms')}
            </span>
          </div>
        )}

        {/* Zone 3: Controls, Language, Sign In & Get Started */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Bilingual Switcher: English | தமிழ் */}
          <div
            className="flex items-center bg-white border border-[#DCE4D9] rounded-[8px] p-0.5 text-xs font-medium shadow-xs"
            role="group"
            aria-label="Language selection"
          >
            <button
              onClick={() => setLanguage('en')}
              className={`px-2.5 py-1 transition-colors cursor-pointer rounded-[6px] ${
                language === 'en'
                  ? 'bg-[#1F6B4A] text-white font-semibold'
                  : 'text-[#52665A] hover:text-[#17271E]'
              }`}
              aria-pressed={language === 'en'}
            >
              English
            </button>
            <span className="text-[#DCE4D9] select-none px-0.5" aria-hidden="true">|</span>
            <button
              onClick={() => setLanguage('ta')}
              className={`px-2.5 py-1 transition-colors cursor-pointer rounded-[6px] ${
                language === 'ta'
                  ? 'bg-[#1F6B4A] text-white font-semibold'
                  : 'text-[#52665A] hover:text-[#17271E]'
              }`}
              aria-pressed={language === 'ta'}
            >
              தமிழ்
            </button>
          </div>

          {/* User Profile or Sign In */}
          {user ? (
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-[#17271E] bg-white hover:bg-[#EAEFE5] border border-[#DCE4D9] transition-colors rounded-[10px] cursor-pointer min-h-[40px] shadow-xs"
              title="Farmer Profile & Settings"
              aria-label="Farmer Profile"
            >
              <div className="w-6 h-6 rounded-full bg-[#1F6B4A] text-white flex items-center justify-center text-[11px] font-bold">
                {(profile?.displayName || user.displayName || user.email || 'F')[0].toUpperCase()}
              </div>
              <span className="hidden sm:inline-block max-w-[120px] truncate">
                {profile?.displayName || user.displayName || user.email?.split('@')[0]}
              </span>
            </button>
          ) : (
            <button
              onClick={() => onOpenAuth('signin')}
              className="flex items-center gap-1.5 px-3.5 py-2 text-[14px] font-medium text-[#17271E] hover:text-[#1F6B4A] hover:bg-[#EAEFE5] transition-colors rounded-[10px] cursor-pointer min-h-[40px]"
              aria-label="Farmer Sign In"
            >
              <User className="w-4 h-4 text-[#52665A]" />
              <span>{t('navSignIn')}</span>
            </button>
          )}

          {/* Prominent "Get Started" Action Button */}
          {isLanding && (
            <button
              onClick={() => onNavigate('diagnose')}
              className="hidden sm:flex items-center gap-1.5 px-4 py-2 text-[14px] font-semibold text-white bg-[#1F6B4A] hover:bg-[#165439] transition-all rounded-[10px] cursor-pointer shadow-[0_2px_6px_rgba(31,107,74,0.2)] min-h-[40px]"
              aria-label={t('navGetStarted')}
            >
              <span>{t('navGetStarted')}</span>
              <ArrowRight className="w-4 h-4 text-white/90" />
            </button>
          )}

          {/* Mobile Menu Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-[#17271E] hover:text-[#1F6B4A] focus-visible:ring-2 focus-visible:ring-[#1F6B4A] rounded-[8px] cursor-pointer"
            aria-label="Toggle Menu"
            aria-expanded={mobileMenuOpen}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6 text-[#17271E]" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-[#DCE4D9] bg-[#F5F3E9] px-5 pt-4 pb-6 space-y-3 shadow-xl">
          <div className="grid grid-cols-2 gap-2 pb-3 border-b border-[#DCE4D9]">
            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate('home');
              }}
              className={`p-3 rounded-[10px] text-left text-xs font-medium flex items-center gap-2 cursor-pointer border ${
                currentView === 'home'
                  ? 'bg-[#1F6B4A] text-white border-[#1F6B4A] font-bold'
                  : 'bg-white text-[#17271E] border-[#DCE4D9]'
              }`}
            >
              <span>{t('navHome')}</span>
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate('diagnose');
              }}
              className={`p-3 rounded-[10px] text-left text-xs font-medium flex items-center gap-2 cursor-pointer border ${
                currentView === 'diagnose'
                  ? 'bg-[#1F6B4A] text-white border-[#1F6B4A] font-bold'
                  : 'bg-white text-[#17271E] border-[#DCE4D9]'
              }`}
            >
              <Camera className="w-4 h-4 shrink-0" />
              <span className="truncate">{t('navCropDiagnosis')}</span>
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate('market-weather');
              }}
              className={`p-3 rounded-[10px] text-left text-xs font-medium flex items-center gap-2 cursor-pointer border ${
                currentView === 'market-weather'
                  ? 'bg-[#1F6B4A] text-white border-[#1F6B4A] font-bold'
                  : 'bg-white text-[#17271E] border-[#DCE4D9]'
              }`}
            >
              <TrendingUp className="w-4 h-4 shrink-0" />
              <span className="truncate">{t('navMarketInsights')}</span>
            </button>

            <button
              onClick={() => {
                setMobileMenuOpen(false);
                onNavigate('my-farm');
              }}
              className={`p-3 rounded-[10px] text-left text-xs font-medium flex items-center gap-2 cursor-pointer border ${
                currentView === 'my-farm'
                  ? 'bg-[#1F6B4A] text-white border-[#1F6B4A] font-bold'
                  : 'bg-white text-[#17271E] border-[#DCE4D9]'
              }`}
            >
              <Layers className="w-4 h-4 shrink-0" />
              <span className="truncate">{t('navMyFarm')}</span>
            </button>
          </div>

          <div className="pt-2 space-y-2">
            <button
              onClick={() => handleScrollToSection('how-it-works')}
              className="block w-full text-left py-2 text-sm text-[#52665A] hover:text-[#1F6B4A] cursor-pointer"
            >
              {t('navFeatures')}
            </button>
            <button
              onClick={() => handleScrollToSection('built-for-field')}
              className="block w-full text-left py-2 text-sm text-[#52665A] hover:text-[#1F6B4A] cursor-pointer"
            >
              {t('navAbout')}
            </button>
          </div>

          <div className="pt-3 border-t border-[#DCE4D9]">
            {user ? (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenProfile();
                }}
                className="w-full py-2.5 px-3 text-left text-xs font-medium text-[#17271E] border border-[#DCE4D9] bg-white rounded-[10px] cursor-pointer flex items-center justify-between"
              >
                <span className="truncate">{profile?.displayName || user.displayName || user.email}</span>
                <span className="text-[11px] text-[#1F6B4A] font-semibold shrink-0">Settings</span>
              </button>
            ) : (
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAuth('signin');
                }}
                className="w-full py-2.5 text-center text-xs font-semibold text-[#17271E] border border-[#DCE4D9] bg-white rounded-[10px] cursor-pointer"
              >
                {t('navSignIn')}
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
};
