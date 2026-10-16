import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Eye, Droplets, Clock } from 'lucide-react';
import { motion } from 'motion/react';
import {
  sectionVariants,
  cardHoverTap,
  defaultViewport,
} from '../../lib/motion';

export const SectionObserved: React.FC = () => {
  const { language, t } = useLanguage();

  return (
    <motion.section
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={defaultViewport}
      className="py-20 border-b border-[#DCE4D9] bg-[#F5F3E9] overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
          {/* Left Text Column */}
          <div className="lg:col-span-6 space-y-6">
            <span className="text-xs font-mono tracking-wider text-[#1F6B4A] uppercase block font-semibold">
              {t('secA_eyebrow')}
            </span>

            <h2 className="text-3xl sm:text-4xl font-bold text-[#102D24] tracking-tight leading-tight">
              {t('secA_title')}
            </h2>

            <p className="text-base sm:text-lg text-[#52665A] leading-relaxed font-sans">
              {t('secA_p1')}
            </p>

            <p className="text-base sm:text-lg text-[#52665A] leading-relaxed font-sans">
              {t('secA_p2')}
            </p>

            {/* In-Field Observation Factors */}
            <div className="mt-8 border-t border-[#DCE4D9] pt-6 space-y-4">
              <motion.div
                whileHover={{ x: 4 }}
                transition={{ duration: 0.15 }}
                className="flex items-start gap-3"
              >
                <Clock className="w-5 h-5 text-[#1F6B4A] shrink-0 mt-0.5" />
                <span className="text-sm sm:text-base text-[#17271E] font-sans">
                  {t('secA_annotation1')}
                </span>
              </motion.div>
              <motion.div
                whileHover={{ x: 4 }}
                transition={{ duration: 0.15 }}
                className="flex items-start gap-3"
              >
                <Droplets className="w-5 h-5 text-[#1F6B4A] shrink-0 mt-0.5" />
                <span className="text-sm sm:text-base text-[#17271E] font-sans">
                  {t('secA_annotation2')}
                </span>
              </motion.div>
              <motion.div
                whileHover={{ x: 4 }}
                transition={{ duration: 0.15 }}
                className="flex items-start gap-3"
              >
                <Eye className="w-5 h-5 text-[#1F6B4A] shrink-0 mt-0.5" />
                <span className="text-sm sm:text-base text-[#17271E] font-sans">
                  {t('secA_annotation3')}
                </span>
              </motion.div>
            </div>
          </div>

          {/* Right Visual Column: Botanical Field Journal Specimen Display */}
          <div className="lg:col-span-6">
            <motion.div
              {...cardHoverTap}
              className="bg-white border border-[#DCE4D9] rounded-[16px] p-6 lg:p-8 shadow-sm cursor-pointer"
            >
              {/* Journal Header */}
              <div className="border-b border-[#DCE4D9] pb-4 mb-6 flex items-center justify-between font-mono text-xs text-[#52665A]">
                <span className="font-semibold text-[#102D24]">
                  CAUVERY BASIN · FIELD NOTE REF #084
                </span>
                <span>SAMBA SEASON 2026</span>
              </div>

              {/* Graphic Representation of Microclimate & Rice Leaf Interaction */}
              <div className="space-y-6">
                {/* Atmospheric Factor Metric Strip */}
                <div className="grid grid-cols-3 gap-3 border border-[#DCE4D9] bg-[#EAEFE5]/60 rounded-[12px] p-4 text-center">
                  <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.15 }}>
                    <span className="block text-[11px] font-mono text-[#52665A] uppercase tracking-wider mb-1">
                      Overnight Dew
                    </span>
                    <span className="text-2xl font-mono font-semibold text-[#102D24] tabular-nums">
                      6.5 <span className="text-xs font-normal text-[#52665A]">hrs</span>
                    </span>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.15 }} className="border-x border-[#DCE4D9]">
                    <span className="block text-[11px] font-mono text-[#52665A] uppercase tracking-wider mb-1">
                      Canopy RH
                    </span>
                    <span className="text-2xl font-mono font-semibold text-[#D7AD63] tabular-nums">
                      88 <span className="text-xs font-normal text-[#52665A]">%</span>
                    </span>
                  </motion.div>
                  <motion.div whileHover={{ scale: 1.05 }} transition={{ duration: 0.15 }}>
                    <span className="block text-[11px] font-mono text-[#52665A] uppercase tracking-wider mb-1">
                      Crop Stage
                    </span>
                    <span className="text-2xl font-mono font-semibold text-[#102D24] tabular-nums">
                      35 <span className="text-xs font-normal text-[#52665A]">DAT</span>
                    </span>
                  </motion.div>
                </div>

                {/* Microscopic Spore Observation Card */}
                <motion.div
                  whileHover={{ y: -2 }}
                  transition={{ duration: 0.15 }}
                  className="p-4 border-l-4 border-[#1F6B4A] bg-[#F5F3E9] rounded-r-[10px] shadow-2xs"
                >
                  <div className="text-xs font-mono font-semibold text-[#102D24] uppercase mb-1">
                    Early Inspection Benefit
                  </div>
                  <p className="text-sm text-[#52665A] leading-relaxed font-sans">
                    {language === 'ta'
                      ? 'இலையின் நடு நரம்பில் தோன்றும் நீள்வட்ட புள்ளிகள் காலைப் பனியில் வேகமாக வளரும். ஆரம்ப 72 மணி நேரத்திற்குள் கண்டறிந்தால், குறைந்த செலவில் உயிரியல் முறையில் முழுமையாகக் கட்டுப்படுத்தலாம்.'
                      : 'Lesions along the midrib of upper leaves enlarge rapidly when overnight dew exceeds 6 hours. Early discovery within 72 hours allows safe bio-control sprays like Pseudomonas before fungal neck blast damages the panicles.'}
                  </p>
                </motion.div>

                {/* Footnote reference */}
                <div className="pt-2 text-[11px] font-mono text-[#718176] flex items-center justify-between border-t border-[#DCE4D9]">
                  <span>RESEARCH ADVISORY: TNAU Rice Pathology</span>
                  <span className="text-[#1F6B4A] font-semibold">VALIDATED FIELD METHOD</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </motion.section>
  );
};
