import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { CropPhotoSpecimen } from '../visuals/CropPhotoSpecimen';
import { ArrowRight, Compass, Sparkles, CheckCircle2 } from 'lucide-react';

interface HeroSectionProps {
  onScanCrop: () => void;
  onExplore: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({ onScanCrop, onExplore }) => {
  const { language, t } = useLanguage();

  return (
    <section className="relative pt-10 pb-16 lg:pt-16 lg:pb-24 border-b border-[#D9DED3] bg-[#F7F6EF] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          {/* Column 1: Asymmetric Text Side (7 Cols on desktop) */}
          <div className="lg:col-span-7 flex flex-col justify-between">
            {/* Small Eyebrow (Letter spaced, unboxed text) */}
            <div className="flex items-center gap-2 text-xs font-mono tracking-wider text-[#426B43] uppercase mb-5">
              <Compass className="w-3.5 h-3.5 text-[#183B2A]" />
              <span>{t('regionTag')}</span>
              <span aria-hidden="true" className="text-[#D9DED3]">/</span>
              <span className="text-[#4A584D]">SAMBA & THALADI 2026</span>
            </div>

            {/* Main Editorial Headline with intentional line breaks and selective italic */}
            <h1 className="font-serif text-4xl sm:text-5xl lg:text-6xl text-[#183B2A] font-normal tracking-tight leading-[1.08] mb-6">
              <span className="block">{t('heroHeadingPart1')}</span>
              <span className="block font-medium">{t('heroHeadingPart2')}</span>
              <span className="block italic font-light text-[#426B43]">{t('heroHeadingPart3')}</span>
              <span className="block font-normal">{t('heroHeadingPart4')}</span>
            </h1>

            {/* Clear, Farmer-Friendly Supporting Text (17-18px) */}
            <p className="text-base sm:text-lg text-[#202B22]/90 max-w-xl leading-relaxed mb-8 font-sans">
              {t('heroSubtext')}
            </p>

            {/* Primary & Secondary Actions with High Visibility */}
            <div className="space-y-4 mb-8">
              <div className="flex flex-wrap items-stretch sm:items-center gap-3">
                {/* Primary Action Button (Strongest Element, Minimum 48px height) */}
                <button
                  onClick={onScanCrop}
                  className="px-8 py-4 min-h-[50px] text-base font-semibold tracking-wide text-white bg-[#183B2A] hover:bg-[#122c20] transition-all rounded-xs flex items-center justify-center gap-2.5 cursor-pointer shadow-sm hover:shadow-md focus-visible:ring-2 focus-visible:ring-[#183B2A] active:scale-[0.99]"
                  aria-label={t('heroPrimaryCta')}
                >
                  <span>{t('heroPrimaryCta')}</span>
                  <ArrowRight className="w-5 h-5 text-[#E5EBDD]" />
                </button>

                {/* Secondary Action */}
                <button
                  onClick={onExplore}
                  className="px-6 py-4 min-h-[50px] text-sm font-medium text-[#183B2A] border border-[#D9DED3] bg-white hover:bg-[#E5EBDD] transition-colors rounded-xs cursor-pointer flex items-center justify-center focus-visible:ring-2 focus-visible:ring-[#183B2A]"
                >
                  {t('heroSecondaryCta')}
                </button>
              </div>

              {/* Sub-action trust label */}
              <div className="text-xs font-mono text-[#4A584D] flex items-center gap-2">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#426B43]" />
                <span>{t('heroPrimaryCtaSub')}</span>
              </div>
            </div>

            {/* Quiet Trust Statement */}
            <div className="border-t border-[#D9DED3] pt-5 max-w-xl">
              <p className="text-xs font-mono text-[#4A584D] tracking-wide uppercase mb-2">
                {t('heroTrustStatement')}
              </p>
              {/* Unboxed Metadata (Zero-pills discipline) */}
              <div className="flex flex-wrap items-center gap-2 text-xs text-[#4A584D]">
                <span>Cauvery Basin</span>
                <span aria-hidden="true">·</span>
                <span>Thanjavur, Tiruvarur & Mayiladuthurai</span>
                <span aria-hidden="true">·</span>
                <span>TNAU Rice Doctor Standards</span>
                <span aria-hidden="true">·</span>
                <span className="text-[#426B43] font-semibold">Aduthurai Met Grid</span>
              </div>
            </div>
          </div>

          {/* Column 2: Visual Composition (5 Cols on desktop) */}
          <div className="lg:col-span-5">
            {/* Visual Specimen with Authentic Rice Leaf View + Botanical Diagram Toggle */}
            <CropPhotoSpecimen onScanClick={onScanCrop} />
          </div>
        </div>
      </div>
    </section>
  );
};
