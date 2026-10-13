import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';

interface BotanicalPlateProps {
  className?: string;
  activeCondition?: 'blast' | 'blb' | 'brownspot' | 'healthy';
  interactive?: boolean;
}

export const BotanicalPlate: React.FC<BotanicalPlateProps> = ({
  className = '',
  activeCondition = 'blast',
  interactive = true,
}) => {
  const { language } = useLanguage();
  const [selectedCallout, setSelectedCallout] = useState<string | null>(null);

  return (
    <div
      className={`relative bg-[#F7F6EF] border border-[#D9DED3] p-5 shadow-xs overflow-hidden select-none ${className}`}
    >
      {/* Botanical Header Bar */}
      <div className="flex items-center justify-between border-b border-[#D9DED3] pb-3 mb-4 text-xs font-mono text-[#667166]">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-[#183B2A]">PLATE NO. TN-04</span>
          <span>/</span>
          <span>ORYZA SATIVA L.</span>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[11px]">
          <span>THIRUVARUR / THANJAVUR DELTA</span>
          <span>·</span>
          <span>10°47'N 79°08'E</span>
        </div>
      </div>

      {/* Main Illustration Area */}
      <div className="relative aspect-4/3 w-full bg-[#FAF9F3] border border-[#E5EBDD] flex items-center justify-center overflow-hidden">
        {/* Subtle coordinate grid lines */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none opacity-40"
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <pattern
              id="botanicalGrid"
              width="32"
              height="32"
              patternUnits="userSpaceOnUse"
            >
              <path
                d="M 32 0 L 0 0 0 32"
                fill="none"
                stroke="#D9DED3"
                strokeWidth="0.8"
              />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#botanicalGrid)" />
          {/* Corner Registration Crosshairs */}
          <path d="M 16 8 L 16 24 M 8 16 L 24 16" stroke="#426B43" strokeWidth="1" />
          <path d="M 98% 8 L 98% 24 M calc(98% - 8px) 16 L calc(98% + 8px) 16" stroke="#426B43" strokeWidth="1" />
        </svg>

        {/* Anatomical Rice Illustration */}
        <svg
          viewBox="0 0 400 300"
          className="w-full h-full max-h-[380px] p-2"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Stem & Sheath */}
          <path
            d="M 200 290 Q 198 210 195 150 Q 193 110 190 70"
            stroke="#426B43"
            strokeWidth="3.5"
            fill="none"
            strokeLinecap="round"
          />

          {/* Rice Leaf Blade 1 (Left arching) */}
          <path
            d="M 197 190 C 160 175 110 185 60 210 C 105 180 155 170 196 186"
            fill="#78965C"
            fillOpacity="0.3"
            stroke="#426B43"
            strokeWidth="1.5"
          />
          {/* Leaf 1 Veins */}
          <path
            d="M 196 186 Q 130 180 60 210"
            stroke="#426B43"
            strokeWidth="1"
            strokeDasharray="2 2"
            fill="none"
          />

          {/* Rice Leaf Blade 2 (Right upward flag leaf) */}
          <path
            d="M 194 135 C 240 100 285 75 340 50 C 290 85 245 115 194 138"
            fill="#78965C"
            fillOpacity="0.4"
            stroke="#426B43"
            strokeWidth="1.6"
          />
          <path
            d="M 194 137 Q 260 100 340 50"
            stroke="#426B43"
            strokeWidth="1"
            strokeDasharray="2 2"
            fill="none"
          />

          {/* Rice Leaf Blade 3 (Main central inspection blade) */}
          <path
            d="M 195 160 C 140 120 120 70 110 20 C 130 65 160 110 195 155"
            fill="#78965C"
            fillOpacity="0.5"
            stroke="#426B43"
            strokeWidth="1.8"
          />

          {/* Condition-Specific Diagnostic Lesions on Central Leaf */}
          {activeCondition === 'blast' && (
            <g className="transition-all duration-300">
              {/* Spindle-shaped lesion 1 */}
              <ellipse
                cx="145"
                cy="85"
                rx="14"
                ry="5"
                transform="rotate(-50 145 85)"
                fill="#E5EBDD"
                stroke="#A94338"
                strokeWidth="1.8"
              />
              <ellipse
                cx="145"
                cy="85"
                rx="6"
                ry="2"
                transform="rotate(-50 145 85)"
                fill="#FAF9F3"
                stroke="#667166"
                strokeWidth="0.8"
              />
              {/* Spindle-shaped lesion 2 */}
              <ellipse
                cx="132"
                cy="62"
                rx="10"
                ry="4"
                transform="rotate(-55 132 62)"
                fill="#E5EBDD"
                stroke="#A94338"
                strokeWidth="1.5"
              />
              {/* Inspection Reticle Callout */}
              <circle cx="145" cy="85" r="22" stroke="#B67B2A" strokeWidth="1" strokeDasharray="3 3" fill="none" />
              <line x1="165" y1="75" x2="230" y2="45" stroke="#B67B2A" strokeWidth="1" />
              <circle cx="230" cy="45" r="2.5" fill="#B67B2A" />
              <text x="238" y="48" fontSize="10" fontFamily="monospace" fill="#183B2A" fontWeight="600">
                M. ORYZAE: SPINDLE LESION
              </text>
            </g>
          )}

          {activeCondition === 'blb' && (
            <g className="transition-all duration-300">
              {/* Marginal wavy blighting */}
              <path
                d="M 112 28 Q 120 50 126 70 Q 120 78 132 95 L 126 90 Q 115 65 110 20 Z"
                fill="#B67B2A"
                fillOpacity="0.75"
                stroke="#A94338"
                strokeWidth="1.2"
              />
              <line x1="126" y1="65" x2="220" y2="55" stroke="#A94338" strokeWidth="1" />
              <circle cx="220" cy="55" r="2.5" fill="#A94338" />
              <text x="228" y="58" fontSize="10" fontFamily="monospace" fill="#A94338" fontWeight="600">
                X. ORYZAE: MARGINAL BLIGHT
              </text>
            </g>
          )}

          {activeCondition === 'brownspot' && (
            <g className="transition-all duration-300">
              {/* Circular sesame spots */}
              <circle cx="145" cy="88" r="4.5" fill="#667166" stroke="#B67B2A" strokeWidth="1.5" />
              <circle cx="135" cy="68" r="3.5" fill="#667166" stroke="#B67B2A" strokeWidth="1.5" />
              <circle cx="155" cy="105" r="3" fill="#667166" stroke="#B67B2A" strokeWidth="1.5" />
              <circle cx="125" cy="50" r="4" fill="#667166" stroke="#B67B2A" strokeWidth="1.5" />
              <line x1="145" y1="88" x2="230" y2="75" stroke="#667166" strokeWidth="1" />
              <circle cx="230" cy="75" r="2.5" fill="#667166" />
              <text x="238" y="78" fontSize="10" fontFamily="monospace" fill="#183B2A" fontWeight="600">
                B. ORYZAE: SESAME SPOT
              </text>
            </g>
          )}

          {activeCondition === 'healthy' && (
            <g className="transition-all duration-300">
              <circle cx="145" cy="85" r="16" stroke="#426B43" strokeWidth="1" strokeDasharray="3 3" fill="none" />
              <line x1="160" y1="80" x2="230" y2="65" stroke="#426B43" strokeWidth="1" />
              <circle cx="230" cy="65" r="2.5" fill="#426B43" />
              <text x="238" y="68" fontSize="10" fontFamily="monospace" fill="#183B2A" fontWeight="600">
                INTACT FOLIAR CHLOROPHYLL
              </text>
            </g>
          )}

          {/* Panicle Spikelets at Top (Emerging Rachis) */}
          <g transform="translate(186, 25)">
            <path d="M 4 45 Q 0 25 -6 5" stroke="#426B43" strokeWidth="1.5" fill="none" />
            {/* Grains */}
            <ellipse cx="-4" cy="10" rx="3.5" ry="6" transform="rotate(20 -4 10)" fill="#78965C" stroke="#426B43" strokeWidth="1" />
            <ellipse cx="2" cy="18" rx="3.5" ry="6" transform="rotate(-25 2 18)" fill="#78965C" stroke="#426B43" strokeWidth="1" />
            <ellipse cx="-7" cy="26" rx="3.5" ry="6" transform="rotate(30 -7 26)" fill="#78965C" stroke="#426B43" strokeWidth="1" />
            <ellipse cx="4" cy="34" rx="3.5" ry="6" transform="rotate(-20 4 34)" fill="#78965C" stroke="#426B43" strokeWidth="1" />
          </g>

          {/* Leaf Collar Annotation */}
          <g>
            <circle cx="197" cy="190" r="3" fill="#183B2A" />
            <line x1="197" y1="190" x2="270" y2="220" stroke="#667166" strokeWidth="1" strokeDasharray="2 2" />
            <text x="275" y="224" fontSize="9" fontFamily="monospace" fill="#667166">
              COLLAR & LIGULE JUNCTION
            </text>
          </g>

          {/* Scale Bar */}
          <g transform="translate(30, 265)">
            <line x1="0" y1="0" x2="50" y2="0" stroke="#183B2A" strokeWidth="1.5" />
            <line x1="0" y1="-3" x2="0" y2="3" stroke="#183B2A" strokeWidth="1.5" />
            <line x1="50" y1="-3" x2="50" y2="3" stroke="#183B2A" strokeWidth="1.5" />
            <text x="12" y="12" fontSize="9" fontFamily="monospace" fill="#667166">
              2.0 CM
            </text>
          </g>
        </svg>

        {/* Diagnostic Metadata Overlay in Corner */}
        <div className="absolute bottom-2 right-2 bg-white/90 border border-[#D9DED3] px-2.5 py-1.5 text-[10px] font-mono text-[#183B2A] backdrop-blur-xs shadow-2xs">
          <div className="font-semibold text-[#183B2A]">
            {activeCondition === 'blast' && 'FOCUS: LEAF BLAST'}
            {activeCondition === 'blb' && 'FOCUS: BACTERIAL BLIGHT'}
            {activeCondition === 'brownspot' && 'FOCUS: BROWN SPOT'}
            {activeCondition === 'healthy' && 'FOCUS: NOMINAL FOLIAGE'}
          </div>
          <div className="text-[#667166] text-[9px]">
            {activeCondition === 'blast' && 'DIAGNOSTIC: Spindle shape, necrotic center'}
            {activeCondition === 'blb' && 'DIAGNOSTIC: Wavy marginal chlorosis'}
            {activeCondition === 'brownspot' && 'DIAGNOSTIC: Sesame halo morphology'}
            {activeCondition === 'healthy' && 'DIAGNOSTIC: No fungal sporulation'}
          </div>
        </div>
      </div>

      {/* Plate Caption Footer */}
      <div className="mt-3 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-[#667166] font-mono gap-2 border-t border-[#D9DED3] pt-2.5">
        <div>
          <span>FIG. 1.2 · </span>
          <span className="text-[#183B2A]">
            {language === 'ta'
              ? 'நெற்பயிர் இலை நோயியல் மாதிரி வரைபடம் (ஆடுதுறை ஆராய்ச்சி மையம்)'
              : 'Foliar pathology diagnostic plate (TNAU Rice Research Station, Aduthurai)'}
          </span>
        </div>
        <div className="text-[10px] uppercase text-[#667166]">
          ILLUSTRATIVE BOTANICAL DIAGRAM
        </div>
      </div>
    </div>
  );
};
