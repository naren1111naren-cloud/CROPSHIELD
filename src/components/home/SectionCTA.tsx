import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { motion } from 'motion/react';
import { sectionVariants, buttonHoverTap, defaultViewport } from '../../lib/motion';
import { ArrowRight, Leaf } from 'lucide-react';

export const SectionCTA: React.FC<{ onGetStarted: () => void; onExplore: () => void }> = ({
  onGetStarted,
  onExplore,
}) => {
  const { t } = useLanguage();

  return (
    <motion.section
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={defaultViewport}
      className="py-20 lg:py-28 bg-[#0B211A] text-[#F5F7F1] relative overflow-hidden"
    >
      {/* Decorative Cadastral Line Pattern in Background */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none opacity-10"
        xmlns="http://www.w3.org/2000/svg"
      >
        <line x1="0" y1="20%" x2="100%" y2="80%" stroke="#FFFFFF" strokeWidth="1" strokeDasharray="4 4" />
        <line x1="20%" y1="0" x2="80%" y2="100%" stroke="#FFFFFF" strokeWidth="1" strokeDasharray="4 4" />
        <circle cx="50%" cy="50%" r="300" stroke="#FFFFFF" strokeWidth="1" fill="none" opacity="0.3" />
      </svg>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
        <div className="inline-flex items-center gap-2 text-xs font-mono text-[#B8DCC1] uppercase tracking-wider mb-6">
          <Leaf className="w-4 h-4 text-[#70B77E]" />
          <span>SUSTAINING TAMIL NADU PADDY YIELDS</span>
        </div>

        <h2 className="text-3xl sm:text-5xl lg:text-6xl font-bold font-['Manrope'] tracking-tight leading-tight mb-6 max-w-3xl mx-auto text-[#F5F7F1]">
          {t('secG_title')}
        </h2>

        <p className="text-base sm:text-lg lg:text-xl text-[#B8DCC1]/90 max-w-2xl mx-auto leading-relaxed font-sans mb-10">
          {t('secG_sub')}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <motion.button
            {...buttonHoverTap}
            onClick={onGetStarted}
            className="px-8 py-3.5 min-h-[48px] text-base font-semibold tracking-wide text-[#102D24] bg-white hover:bg-[#F5F3E9] transition-colors rounded-[11px] flex items-center justify-center gap-2.5 cursor-pointer shadow-md hover:shadow-lg"
          >
            <span>{t('secG_primary')}</span>
            <ArrowRight className="w-5 h-5 text-[#102D24]" />
          </motion.button>

          <motion.button
            {...buttonHoverTap}
            onClick={onExplore}
            className="px-7 py-3.5 min-h-[48px] text-sm font-medium text-[#F5F7F1] border border-[#B8DCC1]/40 hover:bg-[#102D24] hover:border-[#B8DCC1] transition-colors rounded-[11px] cursor-pointer flex items-center justify-center"
          >
            {t('secG_secondary')}
          </motion.button>
        </div>

        {/* Quiet institutional acknowledgement */}
        <div className="mt-14 pt-8 border-t border-[#B8DCC1]/20 text-xs font-mono text-[#B8DCC1]/70 max-w-2xl mx-auto">
          Built for rice farmers, agricultural scientists, and village extension officers across Thanjavur, Tiruvarur, Nagapattinam, Mayiladuthurai, and Madurai districts.
        </div>
      </div>
    </motion.section>
  );
};
