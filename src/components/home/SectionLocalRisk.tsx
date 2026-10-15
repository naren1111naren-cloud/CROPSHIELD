import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { CloudRain, Wind, Thermometer, MapPin, ArrowRight } from 'lucide-react';

export const SectionLocalRisk: React.FC<{ onOpenDashboard: () => void }> = ({ onOpenDashboard }) => {
  const { language, t } = useLanguage();
  const [selectedDistrict, setSelectedDistrict] = useState<'Thanjavur' | 'Tiruvarur' | 'Mayiladuthurai'>('Thanjavur');

  const districtData = {
    Thanjavur: {
      name: 'Thanjavur',
      nameTamil: 'தஞ்சாவூர்',
      zone: 'Cauvery Lower Delta Basin',
      riskLevel: 'Elevated' as const,
      rh: 88,
      dewHours: 6.5,
      temp: '28.4°C',
      blastRisk: 'High',
      blbRisk: 'Moderate',
      advisoryEn: 'Morning dew duration exceeding 6.5 hours combined with relative humidity >85% elevates blast spore germination risk across tillering crops.',
      advisoryTa: '6.5 மணி நேரத்திற்கு மேலான இரவுப் பனிப்பொழிவு மற்றும் 85%க்கும் அதிகமான காற்றின் ஈரப்பதம் காரணமாக இலைக் குலை நோய் பரவ அதிக வாய்ப்புள்ளது.',
    },
    Tiruvarur: {
      name: 'Tiruvarur',
      nameTamil: 'திருவாரூர்',
      zone: 'Cauvery Central Delta Basin',
      riskLevel: 'Elevated' as const,
      rh: 91,
      dewHours: 7.0,
      temp: '29.1°C',
      blastRisk: 'Moderate',
      blbRisk: 'High',
      advisoryEn: 'Tail-end waterlogging and overcast skies create conditions for bacterial leaf blight propagation. Drain standing water where feasible.',
      advisoryTa: 'தேங்கிய நீர் மற்றும் மேகமூட்டம் பாக்டீரியா இலைக்கருகல் நோயின் தாக்கத்தை அதிகரிக்கக்கூடும். வயல்களில் உள்ள தேவையற்ற நீரை வடிக்கவும்.',
    },
    Mayiladuthurai: {
      name: 'Mayiladuthurai',
      nameTamil: 'மயிலாடுதுறை',
      zone: 'Coastal Delta Basin',
      riskLevel: 'Moderate' as const,
      rh: 84,
      dewHours: 5.0,
      temp: '29.5°C',
      blastRisk: 'Moderate',
      blbRisk: 'Moderate',
      advisoryEn: 'Micro-nutrient deficiencies in saline patches require potash top-dressing to prevent brown spot foliar spread.',
      advisoryTa: 'உவர் நில பாக்கெட்டுகள் மற்றும் ஊட்டச்சத்து குறைபாடு காரணமாக இலைப்புள்ளி நோய் வர வாய்ப்புள்ளது. சாம்பல் சத்து இடுவது நல்லது.',
    },
  };

  const curr = districtData[selectedDistrict];

  return (
    <section id="field-alerts" className="py-20 border-b border-[#DCE4D9] bg-[#F5F3E9]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl mb-12">
          <span className="text-xs font-mono tracking-wider text-[#1F6B4A] uppercase block mb-3 font-semibold">
            {t('secD_eyebrow')}
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#102D24] tracking-tight mb-4">
            {t('secD_title')}
          </h2>
          <p className="text-base sm:text-lg text-[#52665A] font-sans leading-relaxed">
            {t('secD_subtitle')}
          </p>
        </div>

        {/* Map-Inspired Grid Architecture */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left: District Selector & Stylized Cadastral Basin Layout */}
          <div className="lg:col-span-5 bg-white border border-[#DCE4D9] rounded-[16px] p-6 shadow-sm">
            <div className="flex items-center justify-between border-b border-[#DCE4D9] pb-3 mb-4 text-xs font-mono text-[#52665A]">
              <span className="font-semibold text-[#102D24]">DELTA DISTRICT SELECTOR</span>
              <span>SAMBA 2026</span>
            </div>

            {/* District Buttons */}
            <div className="space-y-2.5 mb-6">
              {(['Thanjavur', 'Tiruvarur', 'Mayiladuthurai'] as const).map((dist) => {
                const isSelected = selectedDistrict === dist;
                const d = districtData[dist];
                return (
                  <button
                    key={dist}
                    onClick={() => setSelectedDistrict(dist)}
                    className={`w-full p-4 text-left border flex items-center justify-between transition-all cursor-pointer rounded-[12px] ${
                      isSelected
                        ? 'bg-[#EAEFE5] border-[#1F6B4A] shadow-xs'
                        : 'bg-transparent border-[#DCE4D9] hover:bg-[#F5F3E9]/60 text-[#52665A]'
                    }`}
                  >
                    <div>
                      <div className={`text-base sm:text-lg font-bold ${isSelected ? 'text-[#102D24]' : 'text-[#17271E]'}`}>
                        {language === 'ta' ? d.nameTamil : d.name}
                      </div>
                      <div className="text-xs font-mono text-[#52665A] mt-0.5">{d.zone}</div>
                    </div>
                    <div className="text-right">
                      <span className={`text-xs font-mono font-semibold px-2.5 py-1 rounded-[6px] ${d.riskLevel === 'Elevated' ? 'bg-[#A96616]/10 text-[#A96616]' : 'bg-[#1F6B4A]/10 text-[#1F6B4A]'}`}>
                        {d.riskLevel}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Stylized Basin Contour Grid */}
            <div className="relative aspect-16/9 bg-[#F5F3E9]/60 border border-[#DCE4D9] rounded-[12px] p-3.5 flex flex-col justify-between overflow-hidden">
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-25" xmlns="http://www.w3.org/2000/svg">
                <path d="M 0 40 Q 100 20 200 45 T 400 30" stroke="#1F6B4A" strokeWidth="1.2" fill="none" />
                <path d="M 0 80 Q 150 90 250 70 T 400 95" stroke="#1F6B4A" strokeWidth="1.2" fill="none" />
                <path d="M 0 120 Q 80 130 220 110 T 400 130" stroke="#1F6B4A" strokeWidth="1.2" fill="none" />
              </svg>
              <div className="relative z-10 flex items-center justify-between text-xs font-mono text-[#52665A]">
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-[#1F6B4A]" />
                  <span className="font-semibold text-[#102D24]">CAUVERY DELTA AGRO-ZONE</span>
                </div>
                <span>MET GRID</span>
              </div>
              <div className="relative z-10 text-[11px] font-mono text-[#718176]">
                THANJAVUR · TIRUVARUR · MAYILADUTHURAI
              </div>
            </div>
          </div>

          {/* Right: Selected District Weather & Agro-meteorological Advisory */}
          <div className="lg:col-span-7 bg-white border border-[#DCE4D9] rounded-[16px] p-6 lg:p-8 shadow-sm flex flex-col justify-between">
            <div>
              <div className="border-b border-[#DCE4D9] pb-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <span className="text-xs font-mono text-[#1F6B4A] uppercase tracking-wider block font-semibold">
                    REGIONAL AGRO-CLIMATIC DOSSIER
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-bold text-[#102D24] mt-1">
                    {language === 'ta' ? curr.nameTamil : curr.name} · {curr.zone}
                  </h3>
                </div>
                <div className="text-xs font-mono font-semibold bg-[#A96616]/10 text-[#A96616] px-2.5 py-1 rounded-[6px] self-start sm:self-auto">
                  RISK: {curr.riskLevel.toUpperCase()}
                </div>
              </div>

              {/* Environmental Factors Grid */}
              <div className="grid grid-cols-3 gap-3 sm:gap-4 mb-6">
                <div className="bg-[#EAEFE5]/50 border border-[#DCE4D9] rounded-[12px] p-3.5 text-center">
                  <div className="flex items-center justify-center gap-1 text-xs font-mono text-[#52665A] uppercase mb-1">
                    <CloudRain className="w-3.5 h-3.5 text-[#1F6B4A]" />
                    <span>Canopy RH</span>
                  </div>
                  <div className="text-2xl font-mono font-semibold text-[#102D24] tabular-nums">
                    {curr.rh}%
                  </div>
                </div>

                <div className="bg-[#EAEFE5]/50 border border-[#DCE4D9] rounded-[12px] p-3.5 text-center">
                  <div className="flex items-center justify-center gap-1 text-xs font-mono text-[#52665A] uppercase mb-1">
                    <Wind className="w-3.5 h-3.5 text-[#1F6B4A]" />
                    <span>Overnight Dew</span>
                  </div>
                  <div className="text-2xl font-mono font-semibold text-[#102D24] tabular-nums">
                    {curr.dewHours} <span className="text-xs font-normal text-[#52665A]">hrs</span>
                  </div>
                </div>

                <div className="bg-[#EAEFE5]/50 border border-[#DCE4D9] rounded-[12px] p-3.5 text-center">
                  <div className="flex items-center justify-center gap-1 text-xs font-mono text-[#52665A] uppercase mb-1">
                    <Thermometer className="w-3.5 h-3.5 text-[#1F6B4A]" />
                    <span>Temperature</span>
                  </div>
                  <div className="text-2xl font-mono font-semibold text-[#102D24] tabular-nums">
                    {curr.temp}
                  </div>
                </div>
              </div>

              {/* Official Advisory Text */}
              <div className="p-4 bg-[#F5F3E9] border-l-4 border-[#1F6B4A] rounded-r-[10px] mb-6">
                <div className="text-xs font-mono font-semibold text-[#102D24] uppercase mb-1">
                  Official Meteorological Advisory
                </div>
                <p className="text-sm sm:text-base text-[#17271E] font-sans leading-relaxed">
                  {language === 'ta' ? curr.advisoryTa : curr.advisoryEn}
                </p>
              </div>

              {/* Disease Risk Vectors */}
              <div className="grid grid-cols-2 gap-3 text-xs font-mono mb-6">
                <div className="p-3 bg-[#FAF3F2] border border-[#B8423A]/30 rounded-[10px] flex justify-between items-center">
                  <span className="text-[#52665A]">LEAF BLAST RISK:</span>
                  <span className="font-semibold text-[#B8423A]">{curr.blastRisk}</span>
                </div>
                <div className="p-3 bg-[#FEF9EE] border border-[#A96616]/30 rounded-[10px] flex justify-between items-center">
                  <span className="text-[#52665A]">BACTERIAL BLIGHT:</span>
                  <span className="font-semibold text-[#A96616]">{curr.blbRisk}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-[#DCE4D9] pt-4">
              <span className="text-xs font-mono text-[#718176]">
                SOURCE: IMD Agromet Advisory & TNAU Portal
              </span>
              <button
                onClick={onOpenDashboard}
                className="btn-secondary px-4 py-2 min-h-[44px] rounded-[10px] text-xs font-mono flex items-center justify-center gap-1.5 self-start sm:self-auto"
              >
                <span>{t('secD_viewRiskDetails')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
