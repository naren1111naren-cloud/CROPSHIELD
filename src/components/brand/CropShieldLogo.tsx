import React from 'react';
import { useLanguage } from '../../context/LanguageContext';

interface CropShieldLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showTagline?: boolean;
  variant?: 'light' | 'dark';
}

export const CropShieldLogo: React.FC<CropShieldLogoProps> = ({
  className = '',
  size = 'md',
  showTagline = false,
  variant = 'dark',
}) => {
  const { language, t } = useLanguage();

  const isLight = variant === 'light';
  const textColor = isLight ? 'text-white' : 'text-[#183B2A]';
  const subtextColor = isLight ? 'text-[#E5EBDD]' : 'text-[#667166]';
  const strokeColor = isLight ? '#E5EBDD' : '#183B2A';
  const grainColor = isLight ? '#78965C' : '#426B43';

  const iconSizes = {
    sm: 30,
    md: 38,
    lg: 48,
  };

  const textSizes = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  const dimension = iconSizes[size];

  return (
    <div className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      {/* Official CropShield Shield Badge Logo */}
      <img
        src="/logo.png"
        alt="CropShield Logo"
        width={dimension}
        height={dimension}
        className="shrink-0 rounded-lg object-contain transition-transform hover:scale-105 duration-200 shadow-xs"
        style={{ width: `${dimension}px`, height: `${dimension}px` }}
      />

      {/* Wordmark */}
      <div className="flex flex-col">
        <div className="flex items-center gap-1.5 leading-none">
          <span
            className={`font-['Manrope'] font-bold tracking-tight ${textSizes[size]} ${textColor}`}
          >
            CropShield
          </span>
          <span className="text-[11px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-[5px] bg-[#1F6B4A] text-white">
            AI
          </span>
        </div>
        {showTagline && (
          <span
            className={`text-[10px] tracking-wider uppercase font-mono mt-1 ${subtextColor}`}
          >
            {language === 'ta' ? 'வேளாண் நுண்ணறிவு தளம்' : 'Agricultural Intelligence'}
          </span>
        )}
      </div>
    </div>
  );
};
