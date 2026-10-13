import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { FileText, UserCheck, BellRing, ArrowRight } from 'lucide-react';

export const SectionNetwork: React.FC<{ onOpenAlerts: () => void }> = ({ onOpenAlerts }) => {
  const { language, t } = useLanguage();

  return (
    <section className="py-20 border-b border-[#D9DED3] bg-[#F7F6EF]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-2xl mb-14">
          <span className="text-xs font-mono tracking-wider text-[#426B43] uppercase block mb-3 font-semibold">
            {t('secE_eyebrow')}
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#183B2A] tracking-tight mb-4">
            {t('secE_title')}
          </h2>
          <p className="text-base sm:text-lg text-[#4A584D] font-sans leading-relaxed">
            {t('secE_subtitle')}
          </p>
        </div>

        {/* 3-Tier Verification Architecture */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Stage 1 */}
          <div className="bg-white border border-[#D9DED3] p-6 relative flex flex-col justify-between shadow-xs">
            <div>
              <div className="text-[11px] font-mono text-[#4A584D] mb-3 font-semibold">
                TIER 1 · IN-FIELD LOGGING
              </div>
              <div className="w-10 h-10 rounded-xs bg-[#E5EBDD] flex items-center justify-center text-[#183B2A] mb-4">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-xl font-medium text-[#183B2A] mb-2">
                {t('secE_farmer_submission')}
              </h3>
              <p className="text-sm sm:text-base text-[#202B22]/90 leading-relaxed font-sans">
                {language === 'ta'
                  ? 'விவசாயிகள் தங்கள் கிராமம், பயிர் ரகம் மற்றும் இலைப் புகைப்படத்துடன் வயல் பதிவைச் சமர்ப்பிக்கின்றனர்.'
                  : 'Farmers submit local observations with village location, paddy variety, and leaf photos directly from their field.'}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[#D9DED3] text-xs font-mono text-[#4A584D]">
              FAST MOBILE SUBMISSION
            </div>
          </div>

          {/* Stage 2 */}
          <div className="bg-white border border-[#D9DED3] p-6 relative flex flex-col justify-between shadow-xs">
            <div>
              <div className="text-[11px] font-mono text-[#4A584D] mb-3 font-semibold">
                TIER 2 · EXPERT SCRUTINY
              </div>
              <div className="w-10 h-10 rounded-xs bg-[#E5EBDD] flex items-center justify-center text-[#183B2A] mb-4">
                <UserCheck className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-xl font-medium text-[#183B2A] mb-2">
                {t('secE_specialist_review')}
              </h3>
              <p className="text-sm sm:text-base text-[#202B22]/90 leading-relaxed font-sans">
                {language === 'ta'
                  ? 'வட்டார வேளாண் விரிவாக்க அலுவலர்கள் (AEO) மற்றும் பல்கலைக்கழக வல்லுநர்கள் அறிகுறிகளைச் சரிபார்க்கின்றனர்.'
                  : 'Block Agricultural Extension Officers (AEO) and university pathologists inspect photos and arrange field verification.'}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[#D9DED3] text-xs font-mono text-[#4A584D]">
              OFFICER CONFIRMATION
            </div>
          </div>

          {/* Stage 3 */}
          <div className="bg-white border border-[#D9DED3] p-6 relative flex flex-col justify-between shadow-xs">
            <div>
              <div className="text-[11px] font-mono text-[#4A584D] mb-3 font-semibold">
                TIER 3 · REGIONAL CONTAINMENT
              </div>
              <div className="w-10 h-10 rounded-xs bg-[#E5EBDD] flex items-center justify-center text-[#183B2A] mb-4">
                <BellRing className="w-5 h-5" />
              </div>
              <h3 className="font-serif text-xl font-medium text-[#183B2A] mb-2">
                {t('secE_verified_bulletin')}
              </h3>
              <p className="text-sm sm:text-base text-[#202B22]/90 leading-relaxed font-sans">
                {language === 'ta'
                  ? 'உறுதிசெய்யப்பட்ட பாதிப்புகள் மட்டுமே பக்கத்து கிராம விவசாயிகளுக்கு முன்னெச்சரிக்கையாக அனுப்பப்படும்.'
                  : 'Only confirmed incidents trigger regional advisories, helping neighbors protect their crops without panic.'}
              </p>
            </div>
            <div className="mt-6 pt-4 border-t border-[#D9DED3] text-xs font-mono text-[#4A584D]">
              CONTAINMENT BULLETINS
            </div>
          </div>
        </div>

        {/* Incident Summary Bar */}
        <div className="p-5 sm:p-6 bg-white border border-[#D9DED3] flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="w-3 h-3 bg-[#426B43] rounded-full shrink-0"></div>
            <div className="text-xs sm:text-sm font-mono text-[#183B2A]">
              <span className="font-semibold">DELTA REGISTRY:</span> 5 Verified Incidents logged for Samba Season
            </div>
          </div>
          <button
            onClick={onOpenAlerts}
            className="px-5 py-2.5 min-h-[44px] text-xs font-mono font-semibold text-[#183B2A] hover:bg-[#E5EBDD] border border-[#183B2A] rounded-xs flex items-center justify-center gap-2 cursor-pointer self-start sm:self-auto"
          >
            <span>{language === 'ta' ? 'அனைத்து எச்சரிக்கைகளையும் காண்க' : 'View Verified Registry'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </section>
  );
};
