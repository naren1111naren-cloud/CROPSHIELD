import React, { useState } from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Microscope, ShieldCheck, ArrowRight } from 'lucide-react';

export const SectionDiseaseIntelligence: React.FC<{ onLaunchScanner: () => void }> = ({ onLaunchScanner }) => {
  const { language, t } = useLanguage();
  const [selectedDisease, setSelectedDisease] = useState<'blast' | 'blb' | 'brownspot' | 'sheath'>('blast');

  const diseases = [
    {
      id: 'blast' as const,
      name: t('secC_blast_name'),
      latin: t('secC_blast_latin'),
      desc: t('secC_blast_desc'),
      riskCategory: 'High Risk in Samba Season',
      primaryTrigger: 'Heavy morning dew (>6h), cool nights (20–26°C), and excessive urea.',
      tnauControl: 'Foliar spray of Pseudomonas fluorescens @ 5g/L or Tricyclazole 75 WP @ 0.6g/L at early appearance.',
      symptoms: [
        'Spindle or diamond-shaped spots on leaf blades',
        'Center turns grayish-white with dark brown borders',
        'In late stages, leaf collars and neck joints rot and turn black',
      ],
    },
    {
      id: 'blb' as const,
      name: t('secC_blb_name'),
      latin: t('secC_blb_latin'),
      desc: t('secC_blb_desc'),
      riskCategory: 'High Risk in Waterlogged Paddies',
      primaryTrigger: 'Wind-driven monsoon rains and continuous standing water.',
      tnauControl: 'Drain excess standing water immediately + Spray fresh Cow Dung Extract (20%) or Copper Hydroxide @ 2.5g/L.',
      symptoms: [
        'Wavy, undulating yellow stripes starting from leaf tips and margins',
        'Leaves dry up rapidly with a bleached straw appearance',
        'Milky bacterial ooze beads visible on fresh lesions in morning humidity',
      ],
    },
    {
      id: 'brownspot' as const,
      name: t('secC_brownspot_name'),
      latin: t('secC_brownspot_latin'),
      desc: t('secC_brownspot_desc'),
      riskCategory: 'Nutrient-Stress Indicator',
      primaryTrigger: 'Potassium (potash), zinc, or silica deficiency in sandy or alkaline soils.',
      tnauControl: 'Apply muriate of potash (MOP) @ 15-20 kg/acre + spray Mancozeb 75 WP @ 2g/L.',
      symptoms: [
        'Round or oval sesame-seed-sized dark brown spots',
        'Yellow halo ring surrounding mature spots',
        'Spreads uniformly across both young and mature leaves',
      ],
    },
    {
      id: 'sheath' as const,
      name: t('secC_sheath_name'),
      latin: t('secC_sheath_latin'),
      desc: t('secC_sheath_desc'),
      riskCategory: 'Dense Canopy Factor',
      primaryTrigger: 'Close planting distance, dense canopy, and high water levels.',
      tnauControl: 'Spray Validamycin 3% L @ 2ml/L directed toward the lower base of plants.',
      symptoms: [
        'Greenish-grey snake-skin patches on leaf sheaths near water line',
        'Lesions climb upward toward upper leaves as plants mature',
        'Small dark brown mustard-like seeds (sclerotia) form on stems',
      ],
    },
  ];

  const current = diseases.find((d) => d.id === selectedDisease)!;

  return (
    <section id="disease-intelligence" className="py-20 border-b border-[#DCE4D9] bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="max-w-2xl">
            <span className="text-xs font-mono tracking-wider text-[#1F6B4A] uppercase block mb-3 font-semibold">
              {t('secC_eyebrow')}
            </span>
            <h2 className="text-3xl sm:text-4xl font-bold text-[#102D24] tracking-tight mb-3">
              {t('secC_title')}
            </h2>
            <p className="text-base sm:text-lg text-[#52665A] font-sans leading-relaxed">
              {t('secC_subtitle')}
            </p>
          </div>

          <button
            onClick={onLaunchScanner}
            className="btn-primary self-start md:self-auto px-6 py-3 min-h-[46px] rounded-[10px] shrink-0 flex items-center gap-2"
          >
            <span>{t('navScanCrop')}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        {/* Pathology Selector Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
          {diseases.map((d) => {
            const isSelected = d.id === selectedDisease;
            return (
              <button
                key={d.id}
                onClick={() => setSelectedDisease(d.id)}
                className={`p-4 text-left border transition-all cursor-pointer rounded-[12px] ${
                  isSelected
                    ? 'bg-[#EAEFE5] border-[#1F6B4A] shadow-xs'
                    : 'bg-[#F5F3E9]/50 border-[#DCE4D9] hover:bg-white text-[#52665A]'
                }`}
              >
                <div className="text-[11px] font-mono text-[#1F6B4A] mb-1 font-semibold">
                  DISEASE #{d.id.toUpperCase()}
                </div>
                <div className={`text-base sm:text-lg font-bold ${isSelected ? 'text-[#102D24]' : 'text-[#17271E]'}`}>
                  {d.name}
                </div>
                <div className="text-xs italic text-[#52665A] mt-0.5 truncate">
                  {d.latin}
                </div>
              </button>
            );
          })}
        </div>

        {/* Active Disease Diagnostic Dossier */}
        <div className="bg-white border border-[#DCE4D9] rounded-[16px] p-6 lg:p-8 shadow-sm">
          <div className="border-b border-[#DCE4D9] pb-4 mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 font-mono text-xs">
            <div className="flex items-center gap-2">
              <Microscope className="w-4 h-4 text-[#1F6B4A]" />
              <span className="font-semibold text-[#102D24] uppercase">
                {current.name}
              </span>
              <span>·</span>
              <span className="italic text-[#52665A]">{current.latin}</span>
            </div>
            <div className="text-[11px] text-[#D7AD63] uppercase font-semibold">
              FIELD IDENTIFICATION GUIDE
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Left Column: Symptoms & Morphology */}
            <div className="lg:col-span-7 space-y-6">
              <div>
                <h4 className="text-xs font-mono uppercase text-[#52665A] tracking-wider mb-3 font-semibold">
                  What to Look For on the Leaf
                </h4>
                <ul className="space-y-3">
                  {current.symptoms.map((symptom, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm sm:text-base text-[#17271E]">
                      <span className="w-2 h-2 rounded-full bg-[#1F6B4A] mt-2 shrink-0"></span>
                      <span className="font-sans leading-relaxed">{symptom}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-[#DCE4D9] pt-5">
                <h4 className="text-xs font-mono uppercase text-[#52665A] tracking-wider mb-2 font-semibold">
                  Weather & Soil Triggers
                </h4>
                <p className="text-sm sm:text-base text-[#52665A] font-sans leading-relaxed">
                  {current.primaryTrigger}
                </p>
              </div>
            </div>

            {/* Right Column: University-Approved Management */}
            <div className="lg:col-span-5 bg-[#EAEFE5]/50 border border-[#DCE4D9] rounded-[12px] p-5 sm:p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 text-xs font-mono text-[#102D24] font-semibold uppercase mb-3">
                  <ShieldCheck className="w-4.5 h-4.5 text-[#1F6B4A]" />
                  <span>TNAU Recommended Action</span>
                </div>
                <p className="text-sm sm:text-base text-[#17271E] leading-relaxed font-sans mb-5">
                  {current.tnauControl}
                </p>

                <div className="p-3 bg-white border border-[#DCE4D9] rounded-[8px] text-xs font-mono text-[#52665A] space-y-1.5">
                  <div>TREATMENT THRESHOLD: More than 5% leaf area affected</div>
                  <div>SURVEILLANCE: Check field every 2 days during dew periods</div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-[#DCE4D9] text-[11px] font-mono text-[#718176]">
                SOURCE: Tamil Nadu Agricultural University Crop Doctor Guidelines
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
