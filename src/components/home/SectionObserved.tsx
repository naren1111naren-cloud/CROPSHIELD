import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Eye, Droplets, Clock } from 'lucide-react';

export const SectionObserved: React.FC = () => {
  const { language, t } = useLanguage();

  return (
    <section className="py-20 border-b border-[#D9DED3] bg-[#F7F6EF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-6 space-y-6">
            <span className="text-xs font-mono tracking-wider text-[#426B43] uppercase block font-semibold">
              {t('secA_eyebrow')}
            </span>

            <h2 className="font-serif text-3xl sm:text-4xl text-[#183B2A] tracking-tight leading-tight">
              {t('secA_title')}
            </h2>

            <p className="text-base sm:text-lg text-[#202B22]/90 leading-relaxed font-sans">
              {t('secA_p1')}
            </p>

            <p className="text-base sm:text-lg text-[#202B22]/85 leading-relaxed font-sans">
              {t('secA_p2')}
            </p>

            {/* In-Field Observation Factors */}
            <div className="mt-8 border-t border-[#D9DED3] pt-6 space-y-4">
              <div className="flex items-start gap-3">
                <Clock className="w-5 h-5 text-[#426B43] shrink-0 mt-0.5" />
                <span className="text-sm sm:text-base text-[#202B22] font-sans">
                  {t('secA_annotation1')}
                </span>
              </div>
              <div className="flex items-start gap-3">
                <Droplets className="w-5 h-5 text-[#426B43] shrink-0 mt-0.5" />
                <span className="text-sm sm:text-base text-[#202B22] font-sans">
                  {t('secA_annotation2')}
                </span>
              </div>
              <div className="flex items-start gap-3">
                <Eye className="w-5 h-5 text-[#426B43] shrink-0 mt-0.5" />
                <span className="text-sm sm:text-base text-[#202B22] font-sans">
                  {t('secA_annotation3')}
                </span>
              </div>
            </div>
          </div>

          {/* Right Visual Column: Botanical Field Journal Specimen Display */}
          <div className="lg:col-span-6">
            <div className="bg-white border border-[#D9DED3] p-6 lg:p-8 shadow-xs">
              {/* Journal Header */}
              <div className="border-b border-[#D9DED3] pb-4 mb-6 flex items-center justify-between font-mono text-xs text-[#4A584D]">
                <span className="font-semibold text-[#183B2A]">
                  CAUVERY BASIN · FIELD NOTE REF #084
                </span>
                <span>SAMBA SEASON 2026</span>
              </div>

              {/* Graphic Representation of Microclimate & Rice Leaf Interaction */}
              <div className="space-y-6">
                {/* Atmospheric Factor Metric Strip */}
                <div className="grid grid-cols-3 gap-3 border border-[#E5EBDD] bg-[#FAF9F3] p-4 text-center">
                  <div>
                    <span className="block text-[11px] font-mono text-[#4A584D] uppercase tracking-wider mb-1">
                      Overnight Dew
                    </span>
                    <span className="text-2xl font-mono font-semibold text-[#183B2A] tabular-nums">
                      6.5 <span className="text-xs font-normal text-[#4A584D]">hrs</span>
                    </span>
                  </div>
                  <div className="border-x border-[#E5EBDD]">
                    <span className="block text-[11px] font-mono text-[#4A584D] uppercase tracking-wider mb-1">
                      Canopy RH
                    </span>
                    <span className="text-2xl font-mono font-semibold text-[#B67B2A] tabular-nums">
                      88 <span className="text-xs font-normal text-[#4A584D]">%</span>
                    </span>
                  </div>
                  <div>
                    <span className="block text-[11px] font-mono text-[#4A584D] uppercase tracking-wider mb-1">
                      Crop Stage
                    </span>
                    <span className="text-2xl font-mono font-semibold text-[#183B2A] tabular-nums">
                      35 <span className="text-xs font-normal text-[#4A584D]">DAT</span>
                    </span>
                  </div>
                </div>

                {/* Microscopic Spore Observation Card */}
                <div className="p-4 border-l-3 border-[#426B43] bg-[#F7F6EF]">
                  <div className="text-xs font-mono font-semibold text-[#183B2A] uppercase mb-1">
                    Early Inspection Benefit
                  </div>
                  <p className="text-sm text-[#202B22]/90 leading-relaxed font-sans">
                    {language === 'ta'
                      ? 'இலையின் நடு நரம்பில் தோன்றும் நீள்வட்ட புள்ளிகள் காலைப் பனியில் வேகமாக வளரும். ஆரம்ப 72 மணி நேரத்திற்குள் கண்டறிந்தால், குறைந்த செலவில் உயிரியல் முறையில் முழுமையாகக் கட்டுப்படுத்தலாம்.'
                      : 'Lesions along the midrib of upper leaves enlarge rapidly when overnight dew exceeds 6 hours. Early discovery within 72 hours allows safe bio-control sprays like Pseudomonas before fungal neck blast damages the panicles.'}
                  </p>
                </div>

                {/* Footnote reference */}
                <div className="pt-2 text-[11px] font-mono text-[#4A584D] flex items-center justify-between border-t border-[#D9DED3]">
                  <span>RESEARCH ADVISORY: TNAU Rice Pathology</span>
                  <span className="text-[#426B43] font-semibold">VALIDATED FIELD METHOD</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
