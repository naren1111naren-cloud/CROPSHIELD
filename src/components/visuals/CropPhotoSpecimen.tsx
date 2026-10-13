import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { BotanicalPlate } from './BotanicalPlate';
import { Camera, Eye, Info } from 'lucide-react';

interface CropPhotoSpecimenProps {
  className?: string;
  onScanClick?: () => void;
}

export const CropPhotoSpecimen: React.FC<CropPhotoSpecimenProps> = ({
  className = '',
  onScanClick,
}) => {
  const { language } = useLanguage();
  const [viewMode, setViewMode] = useState<'photo' | 'diagram'>('photo');
  const [activeCondition, setActiveCondition] = useState<'blast' | 'blb' | 'brownspot'>('blast');

  return (
    <div className={`bg-white border border-[#D9DED3] p-4 sm:p-5 shadow-xs select-none ${className}`}>
      {/* Top Specimen Ribbon */}
      <div className="flex items-center justify-between border-b border-[#D9DED3] pb-3 mb-3 text-xs font-mono text-[#4A584D]">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#183B2A]">
            {language === 'ta' ? 'கள ஆய்வு மாதிரி' : 'FIELD SPECIMEN'}
          </span>
          <span>·</span>
          <span>ORYZA SATIVA L.</span>
        </div>

        {/* View Mode Toggle (Photo vs Botanical Plate) */}
        <div className="flex items-center gap-1 bg-[#FAF9F3] p-0.5 border border-[#D9DED3] rounded-xs">
          <button
            onClick={() => setViewMode('photo')}
            className={`px-2.5 py-1 text-[11px] font-mono rounded-xs transition-colors cursor-pointer flex items-center gap-1 ${
              viewMode === 'photo'
                ? 'bg-[#183B2A] text-white font-medium'
                : 'text-[#4A584D] hover:text-[#183B2A]'
            }`}
            aria-label="View Field Photo"
          >
            <Camera className="w-3 h-3" />
            <span>{language === 'ta' ? 'நிஜ இலை' : 'Field Photo'}</span>
          </button>
          <button
            onClick={() => setViewMode('diagram')}
            className={`px-2.5 py-1 text-[11px] font-mono rounded-xs transition-colors cursor-pointer flex items-center gap-1 ${
              viewMode === 'diagram'
                ? 'bg-[#183B2A] text-white font-medium'
                : 'text-[#4A584D] hover:text-[#183B2A]'
            }`}
            aria-label="View Botanical Diagram"
          >
            <Eye className="w-3 h-3" />
            <span>{language === 'ta' ? 'வரைபடம்' : 'Diagram'}</span>
          </button>
        </div>
      </div>

      {/* Main Specimen Display Area */}
      {viewMode === 'photo' ? (
        <div className="relative aspect-4/3 w-full bg-[#FAF9F3] border border-[#E5EBDD] overflow-hidden flex flex-col justify-between">
          {/* Authentic High-Detail Rice Leaf Specimen SVG Art Direction */}
          <svg
            viewBox="0 0 480 360"
            className="w-full h-full object-cover"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label="Authentic close-up view of rice paddy leaf blade showing disease symptoms and dew droplets"
          >
            <defs>
              {/* Natural Leaf Blade Gradient */}
              <linearGradient id="leafGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#8DAF6C" />
                <stop offset="35%" stopColor="#678E4C" />
                <stop offset="70%" stopColor="#486D39" />
                <stop offset="100%" stopColor="#315227" />
              </linearGradient>

              {/* Natural Field Background Gradient */}
              <linearGradient id="bgPaddy" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#EBF1E3" />
                <stop offset="100%" stopColor="#DDE6D1" />
              </linearGradient>

              {/* Spindle Necrotic Lesion Center */}
              <radialGradient id="blastLesion" cx="50%" cy="50%" r="50%">
                <stop offset="0%" stopColor="#E8EAE3" />
                <stop offset="45%" stopColor="#C4BCA8" />
                <stop offset="75%" stopColor="#824628" />
                <stop offset="100%" stopColor="#4A2312" />
              </radialGradient>

              {/* Dew Drop Specular */}
              <radialGradient id="dewDrop" cx="35%" cy="35%" r="60%">
                <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.9" />
                <stop offset="50%" stopColor="#E0F2FE" stopOpacity="0.6" />
                <stop offset="100%" stopColor="#0284C7" stopOpacity="0.2" />
              </radialGradient>
            </defs>

            {/* Soft Out-of-Focus Field Background */}
            <rect width="480" height="360" fill="url(#bgPaddy)" />

            {/* Secondary Background Rice Blade (Depth of Field) */}
            <path
              d="M -20 280 Q 180 200 360 80 Q 420 40 500 0"
              stroke="#A8C488"
              strokeWidth="28"
              fill="none"
              opacity="0.5"
            />

            {/* Primary Main Leaf Blade In Focus */}
            <path
              d="M 60 380 Q 200 240 280 140 Q 340 60 410 -20"
              stroke="url(#leafGrad)"
              strokeWidth="56"
              fill="none"
              strokeLinecap="round"
            />

            {/* Parallel Leaf Veins (Oryza sativa venation) */}
            <path
              d="M 60 380 Q 200 240 280 140 Q 340 60 410 -20"
              stroke="#A3C782"
              strokeWidth="2.5"
              fill="none"
              opacity="0.85"
            />
            <path
              d="M 45 370 Q 185 230 265 130 Q 325 50 395 -30"
              stroke="#5D8544"
              strokeWidth="1.2"
              fill="none"
              opacity="0.7"
            />
            <path
              d="M 75 390 Q 215 250 295 150 Q 355 70 425 -10"
              stroke="#5D8544"
              strokeWidth="1.2"
              fill="none"
              opacity="0.7"
            />

            {/* Active Condition Lesions */}
            {activeCondition === 'blast' && (
              <g>
                {/* Primary Spindle Lesion (M. oryzae) */}
                <ellipse
                  cx="250"
                  cy="175"
                  rx="30"
                  ry="11"
                  transform="rotate(-52 250 175)"
                  fill="url(#blastLesion)"
                  stroke="#5A2814"
                  strokeWidth="2"
                />
                {/* Yellow Chlorotic Halo around lesion */}
                <ellipse
                  cx="250"
                  cy="175"
                  rx="38"
                  ry="16"
                  transform="rotate(-52 250 175)"
                  fill="none"
                  stroke="#D4A72C"
                  strokeWidth="2.5"
                  opacity="0.65"
                />

                {/* Secondary developing lesion */}
                <ellipse
                  cx="290"
                  cy="120"
                  rx="18"
                  ry="7"
                  transform="rotate(-52 290 120)"
                  fill="url(#blastLesion)"
                  stroke="#5A2814"
                  strokeWidth="1.5"
                />

                {/* Reticle inspection indicator */}
                <circle cx="250" cy="175" r="48" stroke="#183B2A" strokeWidth="1" strokeDasharray="3 3" fill="none" opacity="0.6" />
                <line x1="250" y1="120" x2="250" y2="130" stroke="#183B2A" strokeWidth="1.5" />
                <line x1="250" y1="220" x2="250" y2="230" stroke="#183B2A" strokeWidth="1.5" />
                <line x1="195" y1="175" x2="205" y2="175" stroke="#183B2A" strokeWidth="1.5" />
                <line x1="295" y1="175" x2="305" y2="175" stroke="#183B2A" strokeWidth="1.5" />
              </g>
            )}

            {activeCondition === 'blb' && (
              <g>
                {/* Wavy bacterial margin */}
                <path
                  d="M 225 210 Q 255 170 270 140 Q 285 100 320 60 L 340 75 Q 300 120 280 160 Q 250 200 235 225 Z"
                  fill="#D49E34"
                  opacity="0.8"
                  stroke="#A94338"
                  strokeWidth="1.5"
                />
                <circle cx="270" cy="140" r="40" stroke="#B67B2A" strokeWidth="1" strokeDasharray="3 3" fill="none" />
              </g>
            )}

            {activeCondition === 'brownspot' && (
              <g>
                <circle cx="230" cy="200" r="8" fill="#543A26" stroke="#D4A72C" strokeWidth="2" />
                <circle cx="255" cy="165" r="7" fill="#543A26" stroke="#D4A72C" strokeWidth="2" />
                <circle cx="275" cy="135" r="6" fill="#543A26" stroke="#D4A72C" strokeWidth="1.8" />
                <circle cx="290" cy="100" r="5" fill="#543A26" stroke="#D4A72C" strokeWidth="1.5" />
              </g>
            )}

            {/* Morning Dew Drops (Real field characteristic) */}
            <circle cx="210" cy="235" r="5.5" fill="url(#dewDrop)" stroke="#BAE6FD" strokeWidth="0.8" />
            <circle cx="212" cy="233" r="1.5" fill="#FFFFFF" opacity="0.9" />

            <circle cx="275" cy="145" r="4" fill="url(#dewDrop)" stroke="#BAE6FD" strokeWidth="0.8" />
            <circle cx="276" cy="144" r="1.2" fill="#FFFFFF" opacity="0.9" />

            <circle cx="310" cy="90" r="4.8" fill="url(#dewDrop)" stroke="#BAE6FD" strokeWidth="0.8" />
            <circle cx="311" cy="89" r="1.4" fill="#FFFFFF" opacity="0.9" />

            {/* Scale Bar in Corner */}
            <g transform="translate(24, 320)">
              <line x1="0" y1="0" x2="60" y2="0" stroke="#183B2A" strokeWidth="2" />
              <line x1="0" y1="-4" x2="0" y2="4" stroke="#183B2A" strokeWidth="2" />
              <line x1="60" y1="-4" x2="60" y2="4" stroke="#183B2A" strokeWidth="2" />
              <text x="14" y="-8" fontSize="11" fontFamily="monospace" fill="#183B2A" fontWeight="600">
                2.0 CM
              </text>
            </g>
          </svg>

          {/* Condition Annotation Card */}
          <div className="p-3 bg-white/95 border-t border-[#D9DED3] flex items-center justify-between text-xs font-mono">
            <div>
              <span className="font-semibold text-[#183B2A] block">
                {activeCondition === 'blast' && (language === 'ta' ? 'குலை நோய் இலை மாதிரி' : 'Rice Blast Symptom (M. oryzae)')}
                {activeCondition === 'blb' && (language === 'ta' ? 'பாக்டீரியா இலைக்கருகல் மாதிரி' : 'Bacterial Blight (X. oryzae)')}
                {activeCondition === 'brownspot' && (language === 'ta' ? 'இலைப்புள்ளி மாதிரி' : 'Brown Spot (B. oryzae)')}
              </span>
              <span className="text-[#4A584D] text-[11px]">
                {activeCondition === 'blast' && 'Spindle lesion with necrotic center and yellow halo'}
                {activeCondition === 'blb' && 'Wavy margins running down the leaf blade'}
                {activeCondition === 'brownspot' && 'Circular spots resembling sesame seeds'}
              </span>
            </div>

            {onScanClick && (
              <button
                onClick={onScanClick}
                className="px-3 py-1.5 text-xs font-mono font-medium text-white bg-[#183B2A] hover:bg-[#122c20] rounded-xs cursor-pointer shadow-2xs shrink-0"
              >
                {language === 'ta' ? 'ஆய்வு செய்' : 'Test Scan'}
              </button>
            )}
          </div>
        </div>
      ) : (
        <BotanicalPlate activeCondition={activeCondition} />
      )}

      {/* Disease Specimen Switcher Below */}
      <div className="mt-3 pt-3 border-t border-[#D9DED3] flex items-center justify-between">
        <span className="text-[11px] font-mono text-[#4A584D]">
          {language === 'ta' ? 'மாதிரி நோய் மாற்றி:' : 'Select Specimen:'}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setActiveCondition('blast')}
            className={`px-2.5 py-1 text-xs font-mono rounded-xs transition-colors cursor-pointer ${
              activeCondition === 'blast'
                ? 'bg-[#183B2A] text-white font-medium'
                : 'bg-[#FAF9F3] border border-[#D9DED3] text-[#202B22] hover:bg-white'
            }`}
          >
            Blast
          </button>
          <button
            onClick={() => setActiveCondition('blb')}
            className={`px-2.5 py-1 text-xs font-mono rounded-xs transition-colors cursor-pointer ${
              activeCondition === 'blb'
                ? 'bg-[#183B2A] text-white font-medium'
                : 'bg-[#FAF9F3] border border-[#D9DED3] text-[#202B22] hover:bg-white'
            }`}
          >
            BLB
          </button>
          <button
            onClick={() => setActiveCondition('brownspot')}
            className={`px-2.5 py-1 text-xs font-mono rounded-xs transition-colors cursor-pointer ${
              activeCondition === 'brownspot'
                ? 'bg-[#183B2A] text-white font-medium'
                : 'bg-[#FAF9F3] border border-[#D9DED3] text-[#202B22] hover:bg-white'
            }`}
          >
            Brown Spot
          </button>
        </div>
      </div>
    </div>
  );
};
