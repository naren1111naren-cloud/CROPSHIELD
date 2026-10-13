import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { ArrowRight, Leaf } from 'lucide-react';

export const SectionCTA: React.FC<{ onGetStarted: () => void; onExplore: () => void }> = ({
  onGetStarted,
  onExplore,
}) => {
  const { t } = useLanguage();

  return (
    <section className="py-20 lg:py-28 bg-[#183B2A] text-white relative overflow-hidden">
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
        <div className="inline-flex items-center gap-2 text-xs font-mono text-[#E5EBDD] uppercase tracking-wider mb-6">
          <Leaf className="w-4 h-4 text-[#78965C]" />
          <span>SUSTAINING TAMIL NADU PADDY YIELDS</span>
        </div>

        <h2 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-normal tracking-tight leading-tight mb-6 max-w-3xl mx-auto">
          {t('secG_title')}
        </h2>

        <p className="text-base sm:text-lg lg:text-xl text-[#E5EBDD]/90 max-w-2xl mx-auto leading-relaxed font-sans mb-10">
          {t('secG_sub')}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            onClick={onGetStarted}
            className="px-8 py-4 min-h-[50px] text-base font-semibold tracking-wide text-[#183B2A] bg-white hover:bg-[#F7F6EF] transition-all rounded-xs flex items-center justify-center gap-2.5 cursor-pointer shadow-sm hover:shadow-md active:scale-[0.99]"
          >
            <span>{t('secG_primary')}</span>
            <ArrowRight className="w-5 h-5 text-[#183B2A]" />
          </button>

          <button
            onClick={onExplore}
            className="px-7 py-4 min-h-[50px] text-sm font-medium text-[#E5EBDD] border border-[#E5EBDD]/50 hover:bg-[#183B2A]/40 hover:border-[#E5EBDD] transition-colors rounded-xs cursor-pointer flex items-center justify-center"
          >
            {t('secG_secondary')}
          </button>
        </div>

        {/* Quiet institutional acknowledgement */}
        <div className="mt-14 pt-8 border-t border-[#E5EBDD]/20 text-xs font-mono text-[#E5EBDD]/80 max-w-2xl mx-auto">
          Built for rice farmers, agricultural scientists, and village extension officers across Thanjavur, Tiruvarur, Nagapattinam, Mayiladuthurai, and Madurai districts.
        </div>
      </div>
    </section>
  );
};
