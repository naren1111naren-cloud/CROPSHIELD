import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { FileText, UserCheck, BellRing, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import {
  sectionVariants,
  staggerContainer,
  itemVariants,
  buttonHoverTap,
  cardHoverTap,
  defaultViewport,
} from '../../lib/motion';

export const SectionNetwork: React.FC<{ onOpenAlerts: () => void }> = ({ onOpenAlerts }) => {
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
        {/* Header */}
        <div className="max-w-2xl mb-14">
          <span className="text-xs font-mono tracking-wider text-[#1F6B4A] uppercase block mb-3 font-semibold">
            {t('secE_eyebrow')}
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#102D24] tracking-tight mb-4">
            {t('secE_title')}
          </h2>
          <p className="text-base sm:text-lg text-[#52665A] font-sans leading-relaxed">
            {t('secE_subtitle')}
          </p>
        </div>

        {/* 3-Tier Verification Architecture */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={defaultViewport}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12"
        >
          {/* Stage 1 */}
          <motion.div
            variants={itemVariants}
            {...cardHoverTap}
            className="bg-white border border-[#DCE4D9] rounded-[16px] p-6 relative flex flex-col justify-between shadow-sm"
          >
            <div>
              <div className="text-[11px] font-mono text-[#52665A] mb-3 font-semibold">
                TIER 1 · IN-FIELD LOGGING
              </div>
              <div className="w-10 h-10 rounded-[10px] bg-[#EAEFE5] flex items-center justify-center text-[#1F6B4A] mb-4">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-[#102D24] mb-2">
                {t('secE_farmer_submission')}
              </h3>
              <p className="text-sm sm:text-base text-[#52665A] leading-relaxed font-sans">
                {language === 'ta'
                  ? 'விவசாயிகள் தங்கள் கிராமம், பயிர் ரகம் மற்றும் இலைப் புகைப்படத்துடன் வயல் பதிவைச் சமர்ப்பிக்கின்றனர்.'
                  : 'Farmers submit local observations with village location, paddy variety, and leaf photos directly from their field.'}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[#DCE4D9] text-xs font-mono text-[#718176]">
              FAST MOBILE SUBMISSION
            </div>
          </motion.div>

          {/* Stage 2 */}
          <motion.div
            variants={itemVariants}
            {...cardHoverTap}
            className="bg-white border border-[#DCE4D9] rounded-[16px] p-6 relative flex flex-col justify-between shadow-sm"
          >
            <div>
              <div className="text-[11px] font-mono text-[#52665A] mb-3 font-semibold">
                TIER 2 · EXPERT SCRUTINY
              </div>
              <div className="w-10 h-10 rounded-[10px] bg-[#EAEFE5] flex items-center justify-center text-[#1F6B4A] mb-4">
                <UserCheck className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-[#102D24] mb-2">
                {t('secE_specialist_review')}
              </h3>
              <p className="text-sm sm:text-base text-[#52665A] leading-relaxed font-sans">
                {language === 'ta'
                  ? 'வட்டார வேளாண் விரிவாக்க அலுவலர்கள் (AEO) மற்றும் பல்கலைக்கழக வல்லுநர்கள் அறிகுறிகளைச் சரிபார்க்கின்றனர்.'
                  : 'Block Agricultural Extension Officers (AEO) and university pathologists inspect photos and arrange field verification.'}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[#DCE4D9] text-xs font-mono text-[#718176]">
              OFFICER CONFIRMATION
            </div>
          </motion.div>

          {/* Stage 3 */}
          <motion.div
            variants={itemVariants}
            {...cardHoverTap}
            className="bg-white border border-[#DCE4D9] rounded-[16px] p-6 relative flex flex-col justify-between shadow-sm"
          >
            <div>
              <div className="text-[11px] font-mono text-[#52665A] mb-3 font-semibold">
                TIER 3 · REGIONAL CONTAINMENT
              </div>
              <div className="w-10 h-10 rounded-[10px] bg-[#EAEFE5] flex items-center justify-center text-[#1F6B4A] mb-4">
                <BellRing className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-bold text-[#102D24] mb-2">
                {t('secE_verified_bulletin')}
              </h3>
              <p className="text-sm sm:text-base text-[#52665A] leading-relaxed font-sans">
                {language === 'ta'
                  ? 'உறுதிசெய்யப்பட்ட பாதிப்புகள் மட்டுமே பக்கத்து கிராம விவசாயிகளுக்கு முன்னெச்சரிக்கையாக அனுப்பப்படும்.'
                  : 'Only confirmed incidents trigger regional advisories, helping neighbors protect their crops without panic.'}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[#DCE4D9] text-xs font-mono text-[#718176]">
              CONTAINMENT BULLETINS
            </div>
          </motion.div>
        </motion.div>

        {/* Incident Summary Bar */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.2 }}
          className="p-5 sm:p-6 bg-white border border-[#DCE4D9] rounded-[14px] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-sm"
        >
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-[#1F6B4A] rounded-full shrink-0 animate-pulse"></div>
            <div className="text-xs sm:text-sm font-mono text-[#102D24]">
              <span className="font-semibold text-[#1F6B4A]">DELTA REGISTRY:</span> 5 Verified Incidents logged for Samba Season
            </div>
          </div>
          <motion.button
            {...buttonHoverTap}
            onClick={onOpenAlerts}
            className="btn-secondary px-5 py-2.5 min-h-[44px] rounded-[10px] text-xs font-mono flex items-center justify-center gap-2 self-start sm:self-auto cursor-pointer shadow-2xs"
          >
            <span>{language === 'ta' ? 'அனைத்து எச்சரிக்கைகளையும் காண்க' : 'View Verified Registry'}</span>
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </motion.div>
      </div>
    </motion.section>
  );
};
