import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { CropShieldLogo } from '../brand/CropShieldLogo';
import { Menu, X, ArrowUpRight, User, Globe, CheckCircle2 } from 'lucide-react';

interface HeaderProps {
  currentView: 'home' | 'dashboard' | 'signin';
  onNavigate: (view: 'home' | 'dashboard' | 'signin', sectionId?: string) => void;
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

  const handleNavClick = (sectionId: string) => {
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
    <>
      <header className="sticky top-0 z-50 bg-[#F7F6EF]/95 backdrop-blur-md border-b border-[#D9DED3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-6">
          {/* Zone 1: Brand Wordmark (Single Element) */}
          <button
            onClick={() => onNavigate('home')}
            className="cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#183B2A] rounded-xs shrink-0 py-1"
            aria-label="CropShield Home"
          >
            <CropShieldLogo size="sm" />
          </button>

          {/* Zone 2: Readable, Clean Navigation Links */}
          <nav
            className="hidden lg:flex items-center gap-7 text-[15px] font-medium text-[#202B22]"
            aria-label="Main Navigation"
          >
            <button
              onClick={() => handleNavClick('how-it-works')}
              className="hover:text-[#183B2A] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#183B2A] px-1 py-2"
            >
              {t('navPlatform')}
            </button>
            <button
              onClick={() => handleNavClick('disease-intelligence')}
              className="hover:text-[#183B2A] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#183B2A] px-1 py-2"
            >
              {t('navDiseaseIntel')}
            </button>
            <button
              onClick={() => handleNavClick('field-alerts')}
              className="hover:text-[#183B2A] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#183B2A] px-1 py-2"
            >
              {t('navFieldAlerts')}
            </button>
            <button
              onClick={() => handleNavClick('about-system')}
              className="hover:text-[#183B2A] hover:underline underline-offset-4 transition-colors whitespace-nowrap shrink-0 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#183B2A] px-1 py-2"
            >
              {t('navAbout')}
            </button>
          </nav>

          {/* Zone 3: Language Switcher + Sign In + Primary Action Button */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Prominent Bilingual Switcher */}
            <div
              className="flex items-center bg-white border border-[#D9DED3] rounded-xs p-0.5 text-xs font-mono"
              role="group"
              aria-label="Language selection"
            >
              <button
                onClick={() => setLanguage('en')}
                className={`px-2.5 py-1.5 transition-colors cursor-pointer rounded-2xs ${
                  language === 'en'
                    ? 'bg-[#183B2A] text-white font-semibold'
                    : 'text-[#4A584D] hover:text-[#183B2A]'
                }`}
                aria-pressed={language === 'en'}
              >
                English
              </button>
              <span className="text-[#D9DED3] select-none" aria-hidden="true">|</span>
              <button
                onClick={() => setLanguage('ta')}
                className={`px-2.5 py-1.5 transition-colors cursor-pointer rounded-2xs ${
                  language === 'ta'
                    ? 'bg-[#183B2A] text-white font-semibold'
                    : 'text-[#4A584D] hover:text-[#183B2A]'
                }`}
                aria-pressed={language === 'ta'}
              >
                தமிழ்
              </button>
            </div>

            {/* Sign In / Profile Switcher */}
            {user ? (
              <button
                onClick={onOpenProfile}
                className="hidden sm:flex items-center gap-2 px-3 py-1.5 text-xs font-mono font-medium text-[#183B2A] bg-[#FAF9F3] hover:bg-[#E5EBDD] border border-[#D9DED3] transition-colors rounded-xs cursor-pointer min-h-[40px]"
                title="View Farmer Cadastral Profile"
                aria-label="Farmer Profile"
              >
                <div className="w-5 h-5 rounded-full bg-[#183B2A] text-white flex items-center justify-center text-[10px] font-bold">
                  {(profile?.displayName || user.displayName || user.email || 'F')[0].toUpperCase()}
                </div>
                <span className="max-w-[120px] truncate font-medium">
                  {profile?.displayName || user.displayName || user.email?.split('@')[0]}
                </span>
              </button>
            ) : (
              <button
                onClick={() => onOpenAuth('signin')}
                className="hidden sm:flex items-center gap-1.5 px-3 py-2 text-xs font-mono font-medium text-[#183B2A] hover:bg-[#E5EBDD] border border-transparent hover:border-[#D9DED3] transition-colors rounded-xs cursor-pointer min-h-[40px]"
                aria-label="Farmer Sign In"
              >
                <User className="w-3.5 h-3.5" />
                <span>{t('navSignIn')}</span>
              </button>
            )}

            {/* Primary Action Button (Touch target >= 44px) */}
            {currentView === 'home' ? (
              <button
                onClick={() => onNavigate('dashboard')}
                className="px-5 py-2.5 min-h-[44px] text-sm font-medium tracking-wide text-white bg-[#183B2A] hover:bg-[#122c20] transition-colors rounded-xs whitespace-nowrap shrink-0 flex items-center gap-1.5 cursor-pointer shadow-xs focus-visible:ring-2 focus-visible:ring-[#183B2A]"
                aria-label={t('navScanCrop')}
              >
                <span>{t('navScanCrop')}</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            ) : currentView === 'signin' ? (
              <button
                onClick={() => onNavigate('home')}
                className="px-4 py-2.5 min-h-[44px] text-xs font-mono font-medium tracking-wide text-[#183B2A] border border-[#183B2A] hover:bg-[#E5EBDD] transition-colors rounded-xs whitespace-nowrap shrink-0 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#183B2A]"
              >
                {language === 'ta' ? 'கள நுண்ணறிவு ஆய்வு →' : 'Explore Platform →'}
              </button>
            ) : (
              <button
                onClick={() => onNavigate('home')}
                className="px-4 py-2.5 min-h-[44px] text-xs font-mono font-medium tracking-wide text-[#183B2A] border border-[#183B2A] hover:bg-[#E5EBDD] transition-colors rounded-xs whitespace-nowrap shrink-0 cursor-pointer focus-visible:ring-2 focus-visible:ring-[#183B2A]"
              >
                {language === 'ta' ? '← முகப்பு பக்கம்' : '← Overview'}
              </button>
            )}

            {/* Mobile Menu Hamburger (Touch target >= 44px) */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2.5 min-h-[44px] min-w-[44px] flex items-center justify-center text-[#202B22] hover:text-[#183B2A] focus-visible:ring-2 focus-visible:ring-[#183B2A] rounded-xs cursor-pointer"
              aria-label="Toggle Menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#D9DED3] bg-[#F7F6EF] px-5 pt-4 pb-6 space-y-3 shadow-lg">
            <button
              onClick={() => handleNavClick('how-it-works')}
              className="block w-full text-left py-3 text-base font-medium text-[#202B22] border-b border-[#D9DED3]/60 cursor-pointer"
            >
              {t('navPlatform')}
            </button>
            <button
              onClick={() => handleNavClick('disease-intelligence')}
              className="block w-full text-left py-3 text-base font-medium text-[#202B22] border-b border-[#D9DED3]/60 cursor-pointer"
            >
              {t('navDiseaseIntel')}
            </button>
            <button
              onClick={() => handleNavClick('field-alerts')}
              className="block w-full text-left py-3 text-base font-medium text-[#202B22] border-b border-[#D9DED3]/60 cursor-pointer"
            >
              {t('navFieldAlerts')}
            </button>
            <button
              onClick={() => handleNavClick('about-system')}
              className="block w-full text-left py-3 text-base font-medium text-[#202B22] border-b border-[#D9DED3]/60 cursor-pointer"
            >
              {t('navAbout')}
            </button>

            <div className="pt-3 space-y-3">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onNavigate('dashboard');
                }}
                className="w-full py-3.5 min-h-[48px] text-center text-sm font-medium text-white bg-[#183B2A] rounded-xs cursor-pointer shadow-xs"
              >
                {t('navScanCrop')}
              </button>

              {user ? (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenProfile();
                  }}
                  className="w-full py-2.5 px-3 text-left text-xs font-mono text-[#183B2A] border border-[#D9DED3] bg-white rounded-xs cursor-pointer flex items-center justify-between"
                >
                  <span className="truncate">{profile?.displayName || user.displayName || user.email}</span>
                  <span className="text-[10px] text-[#426B43] uppercase font-bold shrink-0">Profile</span>
                </button>
              ) : (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenAuth('signin');
                  }}
                  className="w-full py-2.5 text-center text-xs font-mono text-[#183B2A] border border-[#D9DED3] bg-white rounded-xs cursor-pointer"
                >
                  {t('navSignIn')}
                </button>
              )}
            </div>
          </div>
        )}
      </header>
    </>
  );
};
