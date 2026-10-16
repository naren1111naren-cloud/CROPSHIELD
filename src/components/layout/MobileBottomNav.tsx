import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Home, Camera, TrendingUp, Layers } from 'lucide-react';
import { motion } from 'motion/react';

export type MainDestination = 'home' | 'diagnose' | 'market-weather' | 'my-farm';

interface MobileBottomNavProps {
  currentView: MainDestination | string;
  onNavigate: (view: MainDestination) => void;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onNavigate,
}) => {
  const { language } = useLanguage();
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
      labelTa: 'பயிர் ஆய்வு',
      icon: Camera,
      isPrimary: true,
    },
    {
      id: 'market-weather',
      labelEn: 'Markets',
      labelTa: 'சந்தை',
      icon: TrendingUp,
    },
    {
      id: 'my-farm',
      labelEn: 'My Farms',
      labelTa: 'பண்ணை',
      icon: Layers,
    },
  ];

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#F5F3E9]/95 backdrop-blur-md border-t border-[#DCE4D9] px-2 py-1 safe-area-pb shadow-[0_-2px_10px_rgba(16,45,36,0.06)]"
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
              <motion.button
                key={item.id}
                whileTap={{ scale: 0.9 }}
                whileHover={{ scale: 1.05 }}
                onClick={() => onNavigate(item.id)}
                className="flex flex-col items-center justify-center -mt-3.5 group cursor-pointer focus-visible:outline-hidden min-h-[48px]"
                aria-label={isTa ? item.labelTa : item.labelEn}
                aria-current={isActive ? 'page' : undefined}
              >
                <div
                  className={`w-13 h-13 rounded-full flex items-center justify-center shadow-[0_4px_12px_rgba(31,107,74,0.3)] border-2 transition-colors ${
                    isActive
                      ? 'bg-[#1F6B4A] text-white border-white'
                      : 'bg-[#1F6B4A] text-[#F5F7F1] border-[#EAEFE5]'
                  }`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <span
                  className={`text-[11px] mt-0.5 tracking-tight font-semibold ${
                    isActive ? 'text-[#1F6B4A]' : 'text-[#52665A]'
                  }`}
                >
                  {isTa ? item.labelTa : item.labelEn}
                </span>
              </motion.button>
            );
          }

          return (
            <motion.button
              key={item.id}
              whileTap={{ scale: 0.92 }}
              onClick={() => onNavigate(item.id)}
              className={`flex flex-col items-center justify-center min-w-[64px] min-h-[48px] px-2 py-1 transition-colors cursor-pointer rounded-[8px] relative ${
                isActive
                  ? 'text-[#1F6B4A]'
                  : 'text-[#718176] hover:text-[#17271E]'
              }`}
              aria-label={isTa ? item.labelTa : item.labelEn}
              aria-current={isActive ? 'page' : undefined}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.4]' : 'stroke-[1.8]'}`} />
              <span
                className={`text-[11px] mt-0.5 font-medium ${
                  isActive ? 'font-bold text-[#1F6B4A]' : 'text-[#52665A]'
                }`}
              >
                {isTa ? item.labelTa : item.labelEn}
              </span>
              {isActive && (
                <motion.div
                  layoutId="activeMobileIndicator"
                  className="absolute bottom-0 w-3 h-0.5 bg-[#1F6B4A] rounded-full"
                  transition={{ type: 'spring', stiffness: 500, damping: 30 }}
                />
              )}
            </motion.button>
          );
        })}
      </div>
    </nav>
  );
};
