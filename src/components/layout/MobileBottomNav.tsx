import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';
import { Home, Camera, CloudSun, Layers } from 'lucide-react';

export type MainDestination = 'home' | 'diagnose' | 'market-weather' | 'my-farm';

interface MobileBottomNavProps {
  currentView: MainDestination | string;
  onNavigate: (view: MainDestination) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onNavigate,
}) => {
  const { language, t } = useLanguage();
  const { user } = useAuth();
  const isTa = language === 'ta';

  const navItems: {
    id: MainDestination;
    labelEn: string;
    labelTa: string;
    icon: React.ComponentType<{ className?: string }>;
    isPrimary?: boolean;
  }[] = [
    {
      id: 'home',
      labelEn: 'Home',
      labelTa: 'முகப்பு',
      icon: Home,
    },
    {
      id: 'diagnose',
      labelEn: 'Diagnose',
      labelTa: 'ஆய்வு',
      icon: Camera,
      isPrimary: true,
    },
    {
      id: 'market-weather',
      labelEn: 'Market & Rain',
      labelTa: 'சந்தை/வானிலை',
      icon: CloudSun,
    },
    {
      id: 'my-farm',
      labelEn: 'My Farm',
      labelTa: 'என் பண்ணை',
      icon: Layers,
    },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#F7F6EF]/95 backdrop-blur-md border-t border-[#D9DED3] px-2 py-1 safe-area-pb shadow-[0_-2px_10px_rgba(0,0,0,0.05)]"
      aria-label="Mobile Bottom Navigation"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map((item) => {
          const isActive =
            currentView === item.id ||
            (item.id === 'diagnose' && currentView === 'dashboard');
          const Icon = item.icon;

          if (item.isPrimary) {
            return (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className="flex flex-col items-center justify-center -mt-3.5 group cursor-pointer focus-visible:outline-hidden"
                aria-label={isTa ? item.labelTa : item.labelEn}
                aria-current={isActive ? 'page' : undefined}
              >
                <div
                  className={`w-13 h-13 rounded-full flex items-center justify-center shadow-md transition-transform active:scale-95 border-2 ${
                    isActive
                      ? 'bg-[#183B2A] text-white border-white'
                      : 'bg-[#183B2A] text-[#FAF9F3] border-[#FAF9F3]'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <span
                  className={`text-[10px] font-mono mt-0.5 tracking-tight font-bold ${
                    isActive ? 'text-[#183B2A]' : 'text-[#4A584D]'
                  }`}
                >
                  {isTa ? item.labelTa : item.labelEn}
                </span>
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center min-w-[64px] min-h-[48px] px-2 py-1 transition-colors cursor-pointer rounded-xs ${
                isActive
                  ? 'text-[#183B2A]'
                  : 'text-[#667166] hover:text-[#183B2A]'
              }`}
              aria-label={isTa ? item.labelTa : item.labelEn}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.3]' : 'stroke-[1.8]'}`} />
              <span
                className={`text-[11px] font-mono mt-1 ${
                  isActive ? 'font-bold text-[#183B2A]' : 'text-[#4A584D]'
                }`}
              >
                {isTa ? item.labelTa : item.labelEn}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
