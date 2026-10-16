import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { motion } from 'motion/react';
import {
  pageVariants,
  buttonHoverTap,
  heroWordContainer,
  heroWordItem,
  staggerContainerFast,
  itemVariants,
  forestEase,
} from '../../lib/motion';
import { RiceBotanicalGraphic } from '../brand/RiceBotanicalGraphic';
import {
  ArrowRight,
  Camera,
  Compass,
  CheckCircle2,
  BookOpen,
  Sprout,
  Sparkles,
  TrendingUp,
  MapPin,
} from 'lucide-react';

interface HeroSectionProps {
  onScanCrop: () => void;
  onExplore?: () => void;
  onExploreFarmMap?: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onScanCrop,
  onExplore,
  onExploreFarmMap,
}) => {
  const { language, t } = useLanguage();
  const isTa = language === 'ta';

  const headingPart1Words = t('heroHeadingPart1').split(' ');
  const headingPart2Words = t('heroHeadingPart2').split(' ');

  const handlePrimaryClick = () => {
    if (onScanCrop) {
      onScanCrop();
    } else {
      const el = document.getElementById('disease-intelligence');
      el?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleSecondaryClick = () => {
    if (onExploreFarmMap) {
      onExploreFarmMap();
    } else if (onExplore) {
      onExplore();
    } else {
      const el = document.getElementById('field-alerts');
      el?.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <motion.section
      variants={pageVariants}
      initial="hidden"
      animate="visible"
      className="relative pt-10 pb-16 lg:pt-16 lg:pb-24 border-b border-[#DCE4D9] bg-[#F5F3E9] overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-center">
          {/* Column 1: Editorial Content Side (7 Cols on desktop) */}
          <div className="lg:col-span-7 flex flex-col justify-between">
            {/* System Eyebrow Badge */}
            <motion.div
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.4, ease: forestEase }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-[#EAEFE5] border border-[#B8DCC1]/70 rounded-full text-xs font-semibold text-[#1F6B4A] tracking-wide mb-6 w-fit shadow-2xs"
            >
              <Compass className="w-3.5 h-3.5 text-[#1F6B4A]" />
              <span className="uppercase">{t('regionTag')}</span>
            </motion.div>

            {/* Main Hero Headline with Editorial Staggered Word Reveals */}
            <motion.h1
              variants={heroWordContainer}
              initial="hidden"
              animate="visible"
              className="font-['Manrope'] text-[38px] sm:text-[46px] lg:text-[58px] leading-[1.08] font-bold tracking-[-0.03em] mb-6"
            >
              <span className="block text-[#0B211A] mb-1">
                {headingPart1Words.map((word, i) => (
                  <motion.span
                    key={`p1-${i}-${word}`}
                    variants={heroWordItem}
                    className="inline-block mr-[0.24em]"
                  >
                    {word}
                  </motion.span>
                ))}
              </span>
              <span className="block text-[#1F6B4A]">
                {headingPart2Words.map((word, i) => (
                  <motion.span
                    key={`p2-${i}-${word}`}
                    variants={heroWordItem}
                    className="inline-block mr-[0.24em]"
                  >
                    {word}
                  </motion.span>
                ))}
              </span>
            </motion.h1>

            {/* Clear, Farmer-Friendly Supporting Text */}
            <motion.p
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.25, ease: forestEase }}
              className="text-[17px] sm:text-[18px] text-[#52665A] leading-relaxed max-w-xl mb-8 font-normal font-sans"
            >
              {t('heroSubtext')}
            </motion.p>

            {/* Primary & Secondary Actions */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.35, ease: forestEase }}
              className="space-y-4 mb-10"
            >
              <div className="flex flex-wrap items-stretch sm:items-center gap-3.5">
                {/* Primary Action Button: Analyze Crop Health */}
                <motion.button
                  {...buttonHoverTap}
                  onClick={handlePrimaryClick}
                  className="px-7 py-3.5 min-h-[48px] text-[15px] sm:text-[16px] font-semibold text-white bg-[#1F6B4A] hover:bg-[#165439] transition-all rounded-[11px] flex items-center justify-center gap-2.5 cursor-pointer shadow-[0_2px_8px_rgba(31,107,74,0.25)] hover:shadow-[0_4px_14px_rgba(31,107,74,0.32)] focus-visible:ring-2 focus-visible:ring-[#1F6B4A]"
                  aria-label={t('heroPrimaryCta')}
                >
                  <Camera className="w-5 h-5 text-white/90" />
                  <span>{t('heroPrimaryCta')}</span>
                  <ArrowRight className="w-4 h-4 text-white/80" />
                </motion.button>

                {/* Secondary Action: Explore Farm Map */}
                <motion.button
                  {...buttonHoverTap}
                  onClick={handleSecondaryClick}
                  className="px-6 py-3.5 min-h-[48px] text-[15px] font-medium text-[#102D24] border border-[#DCE4D9] bg-white hover:bg-[#EAEFE5] transition-all rounded-[11px] cursor-pointer flex items-center justify-center gap-2 focus-visible:ring-2 focus-visible:ring-[#1F6B4A] shadow-2xs"
                >
                  <MapPin className="w-4 h-4 text-[#1F6B4A]" />
                  <span>{t('heroSecondaryCta')}</span>
                </motion.button>
              </div>

              {/* Sub-action trust note */}
              <div className="text-[13px] text-[#718176] flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#28764A]" />
                <span>{t('heroPrimaryCtaSub')}</span>
              </div>
            </motion.div>

            {/* Restrained Proof Section with Staggered Entrance */}
            <motion.div
              variants={staggerContainerFast}
              initial="hidden"
              animate="visible"
              className="border-t border-[#DCE4D9] pt-6 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl"
            >
              <motion.div variants={itemVariants} className="flex items-start gap-2.5">
                <div className="p-1.5 bg-[#EAEFE5] rounded-[8px] text-[#1F6B4A] shrink-0 mt-0.5">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-[13px] font-semibold text-[#17271E]">
                    {isTa ? 'செயற்கை நுண்ணறிவு ஆய்வு' : 'AI Crop Diagnosis'}
                  </h4>
                  <p className="text-[12px] text-[#718176] leading-snug">
                    {isTa ? 'இலை நோய்கள் நேரடி பகுப்பாய்வு' : 'Instant vision analysis on foliar disease'}
                  </p>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="flex items-start gap-2.5">
                <div className="p-1.5 bg-[#EAEFE5] rounded-[8px] text-[#1F6B4A] shrink-0 mt-0.5">
                  <BookOpen className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-[13px] font-semibold text-[#17271E]">
                    {isTa ? 'பயிர் பராமரிப்பு வழிகாட்டல்' : 'Crop Care Guidance'}
                  </h4>
                  <p className="text-[12px] text-[#718176] leading-snug">
                    {isTa ? 'TNAU பரிந்துரைத்த உயிரியல் தீர்வுகள்' : 'Biological & cultural field protocols'}
                  </p>
                </div>
              </motion.div>

              <motion.div variants={itemVariants} className="flex items-start gap-2.5">
                <div className="p-1.5 bg-[#EAEFE5] rounded-[8px] text-[#1F6B4A] shrink-0 mt-0.5">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-[13px] font-semibold text-[#17271E]">
                    {isTa ? 'நேரடி சந்தை விலைகள்' : 'Market Insights'}
                  </h4>
                  <p className="text-[12px] text-[#718176] leading-snug">
                    {isTa ? 'தமிழ்நாடு வேளாண் சந்தை நிலவரம்' : 'Real-time Agmarknet mandi data'}
                  </p>
                </div>
              </motion.div>
            </motion.div>
          </div>

          {/* Column 2: Authentic Agricultural Photography Composition with Restrained Botanical Graphic */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.2, ease: forestEase }}
            className="lg:col-span-5 relative"
          >
            <div className="relative rounded-[16px] overflow-hidden border border-[#DCE4D9] bg-white shadow-[0_4px_20px_rgba(16,45,36,0.08)] group">
              {/* Authentic Rice Field Image with Subtle Depth */}
              <div className="aspect-[4/3] sm:aspect-[16/11] w-full overflow-hidden relative">
                <img
                  src="/images/tamil_nadu_rice_field.jpg"
                  alt={
                    isTa
                      ? 'தமிழ்நாடு தஞ்சாவூர் காவேரி பாசனப் படுகையில் உள்ள பசுமையான நெல் வயல் மற்றும் விவசாயிகள்'
                      : 'Authentic healthy rice paddy fields in Thanjavur, Cauvery Delta, Tamil Nadu under warm natural morning sunlight'
                  }
                  className="w-full h-full object-cover object-center transform group-hover:scale-[1.03] transition-transform duration-700 ease-out"
                  loading="eager"
                />
                {/* Subtle dark vignette overlay at bottom to guarantee badge contrast */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#0B211A]/85 via-[#0B211A]/20 to-transparent pointer-events-none" />

                {/* Top Left Badge: Verified Field Provenance with Animated Radar Pulse */}
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.4, delay: 0.5 }}
                  className="absolute top-3.5 left-3.5 flex items-center gap-2 bg-[#0B211A]/85 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/15 text-white text-[12px] font-medium shadow-md"
                >
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#70B77E] opacity-75" />
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-[#70B77E]" />
                  </span>
                  <span>{isTa ? 'காவேரி பாசனப் படுகை · தஞ்சாவூர்' : 'Cauvery Delta Basin · Thanjavur'}</span>
                </motion.div>

                {/* Top Right Specimen Chip: Restrained Animated Botanical Rice Graphic */}
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.6, ease: forestEase }}
                  className="absolute top-3.5 right-3.5 bg-white/95 backdrop-blur-md rounded-[12px] border border-[#DCE4D9] px-2.5 py-1.5 flex items-center gap-2 shadow-md"
                >
                  <RiceBotanicalGraphic size="sm" className="w-7 h-9 shrink-0" />
                  <div className="text-left">
                    <div className="text-[10px] font-mono font-bold text-[#1F6B4A] uppercase tracking-wider leading-none">
                      ORYZA SATIVA
                    </div>
                    <div className="text-[9px] font-mono text-[#52665A] mt-0.5 leading-none">
                      {isTa ? 'நெல் மாதிரி' : 'Paddy Specimen'}
                    </div>
                  </div>
                </motion.div>

                {/* Bottom Overlay Information Ribbon */}
                <motion.div
                  initial={{ opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.45, delay: 0.4, ease: forestEase }}
                  className="absolute bottom-3.5 inset-x-3.5 p-3.5 bg-white/95 backdrop-blur-md rounded-[12px] border border-[#DCE4D9] shadow-lg flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="text-[11px] font-mono text-[#52665A] uppercase tracking-wider flex items-center gap-1.5 font-semibold">
                      <Sprout className="w-3.5 h-3.5 text-[#1F6B4A]" />
                      <span>{isTa ? 'பயிர் ஆய்வு மாதிரி' : 'FIELD MONITORING'}</span>
                      <span>·</span>
                      <span className="text-[#1F6B4A]">PADDY INTELLIGENCE</span>
                    </div>
                    <div className="text-[14px] font-semibold text-[#17271E] mt-0.5">
                      {isTa ? 'நெல், பருத்தி, தக்காளி, மிளகாய், மக்காச்சோளம்' : 'Paddy, Cotton, Tomato, Chilli, Maize'}
                    </div>
                  </div>

                  <motion.button
                    {...buttonHoverTap}
                    onClick={handlePrimaryClick}
                    className="px-3.5 py-2 bg-[#1F6B4A] hover:bg-[#165439] text-white text-[12px] font-semibold rounded-[8px] transition-colors shrink-0 flex items-center gap-1.5 cursor-pointer shadow-xs"
                  >
                    <Camera className="w-3.5 h-3.5" />
                    <span>{isTa ? 'ஆய்வு செய்' : 'Diagnose'}</span>
                  </motion.button>
                </motion.div>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </motion.section>
  );
};
