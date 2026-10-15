import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { CropShieldLogo } from '../brand/CropShieldLogo';
import {
  Menu,
  X,
  ArrowUpRight,
  User,
  Home,
  Camera,
  CloudSun,
  Layers,
  Sprout,
  BookOpen
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

  const navItems = [
    {
      id: 'home' as AppNavView,
      label: t('navHome') || (isTa ? 'முகப்பு' : 'Home'),
      icon: Home,
    },
    {
      id: 'diagnose' as AppNavView,
      label: t('navDiagnose') || (isTa ? 'பயிர் ஆய்வு' : 'Diagnose'),
      icon: Camera,
      highlight: true,
    },
    {
      id: 'market-weather' as AppNavView,
      label: t('navMarketWeather') || (isTa ? 'சந்தை & வானிலை' : 'Market & Weather'),
      icon: CloudSun,
    },
    {
      id: 'my-farm' as AppNavView,
      label: t('navMyFarm') || (isTa ? 'என் பண்ணை' : 'My Farm'),
      icon: Layers,
    },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 bg-[#F7F6EF]/95 backdrop-blur-md border-b border-[#D9DED3]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          {/* Zone 1: Brand Wordmark */}
          <button
            onClick={() => onNavigate('home')}
            className="cursor-pointer focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-[#183B2A] rounded-xs shrink-0 py-1"
            aria-label="CropShield Home"
          >
            <CropShieldLogo size="sm" />
          </button>

          {/* Zone 2: 4 Primary Destinations Navigation */}
          <nav
            className="hidden md:flex items-center gap-1 sm:gap-2 text-[14px] font-mono text-[#202B22]"
            aria-label="Main Navigation"
          >
            {navItems.map((item) => {
              const isActive =
                currentView === item.id ||
                (item.id === 'diagnose' && currentView === 'dashboard');
              const Icon = item.icon;

              return (
                <button
                  key={item.id}
                  onClick={() => onNavigate(item.id)}
                  className={`px-3 py-2 rounded-xs transition-colors cursor-pointer flex items-center gap-1.5 focus-visible:ring-2 focus-visible:ring-[#183B2A] ${
                    isActive
                      ? 'bg-[#183B2A] text-white font-semibold shadow-xs'
                      : 'text-[#202B22] hover:text-[#183B2A] hover:bg-[#E5EBDD]/60'
                  }`}
                  aria-current={isActive ? 'page' : undefined}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Language Switcher + User Profile / Sign In */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Bilingual Switcher */}
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

            {/* User Profile or Sign In */}
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
                <span className="max-w-[110px] truncate font-medium">
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

            {/* Quick Action button for desktop */}
            {currentView !== 'diagnose' && (
              <button
                onClick={() => onNavigate('diagnose')}
                className="hidden lg:flex items-center gap-1.5 px-4 py-2 text-xs font-mono font-bold tracking-wide text-white bg-[#183B2A] hover:bg-[#122c20] transition-colors rounded-xs cursor-pointer shadow-xs min-h-[40px]"
                aria-label={t('navScanCrop')}
              >
                <Camera className="w-3.5 h-3.5" />
                <span>{t('navScanCrop')}</span>
              </button>
            )}

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 min-h-[44px] min-w-[44px] flex items-center justify-center text-[#202B22] hover:text-[#183B2A] focus-visible:ring-2 focus-visible:ring-[#183B2A] rounded-xs cursor-pointer"
              aria-label="Toggle Menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-[#D9DED3] bg-[#F7F6EF] px-5 pt-4 pb-6 space-y-2 shadow-lg">
            <div className="grid grid-cols-2 gap-2 pb-3 border-b border-[#D9DED3]">
              {navItems.map((item) => {
                const isActive =
                  currentView === item.id ||
                  (item.id === 'diagnose' && currentView === 'dashboard');
                const Icon = item.icon;

                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setMobileMenuOpen(false);
                      onNavigate(item.id);
                    }}
                    className={`p-3 rounded-xs text-left text-xs font-mono flex items-center gap-2 cursor-pointer border ${
                      isActive
                        ? 'bg-[#183B2A] text-white border-[#183B2A] font-bold'
                        : 'bg-white text-[#202B22] border-[#D9DED3]'
                    }`}
                  >
                    <Icon className="w-4 h-4 shrink-0" />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>

            <div className="pt-2 space-y-2">
              <button
                onClick={() => handleNavClick('how-it-works')}
                className="block w-full text-left py-2 text-sm text-[#4A584D] hover:text-[#183B2A] cursor-pointer"
              >
                {t('navPlatform')}
              </button>
              <button
                onClick={() => handleNavClick('disease-intelligence')}
                className="block w-full text-left py-2 text-sm text-[#4A584D] hover:text-[#183B2A] cursor-pointer"
              >
                {t('navDiseaseIntel')}
              </button>
            </div>

            <div className="pt-3 border-t border-[#D9DED3] space-y-2">
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
                  className="w-full py-2.5 text-center text-xs font-mono text-[#183B2A] border border-[#D9DED3] bg-white rounded-xs cursor-pointer font-semibold"
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
