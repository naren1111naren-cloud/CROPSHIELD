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
        <span
          className={`font-serif tracking-tight font-medium ${textSizes[size]} ${textColor} leading-none`}
        >
          {language === 'ta' ? 'CropShield' : 'CropShield'}
        </span>
        {showTagline && (
          <span
            className={`text-[10px] tracking-wider uppercase font-mono mt-1 ${subtextColor}`}
          >
            {language === 'ta' ? 'கள நுண்ணறிவு · தமிழ்நாடு' : 'Fieldnote Intelligence'}
          </span>
        )}
      </div>
    </div>
  );
};
