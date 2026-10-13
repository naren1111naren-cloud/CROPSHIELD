import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { CropShieldLogo } from '../brand/CropShieldLogo';
import { AlertCircle, Phone, ExternalLink } from 'lucide-react';

export const Footer: React.FC<{ onNavigate: (view: 'home' | 'dashboard') => void }> = ({ onNavigate }) => {
  const { language, t } = useLanguage();

  return (
    <footer className="bg-[#FAF9F3] border-t border-[#D9DED3] text-[#202B22]">
      {/* Top Disclaimer Notice Banner */}
      <div className="border-b border-[#D9DED3] bg-[#F7F6EF] py-4">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-start sm:items-center gap-3 text-xs sm:text-sm text-[#4A584D] font-sans">
          <AlertCircle className="w-4.5 h-4.5 text-[#B67B2A] shrink-0 mt-0.5 sm:mt-0" />
          <span>{t('footerDisclaimer')}</span>
        </div>
      </div>

      {/* Main Footer Grid */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* Brand Col */}
          <div className="md:col-span-5 space-y-4">
            <CropShieldLogo size="md" showTagline={true} />
            <p className="text-sm text-[#4A584D] leading-relaxed max-w-sm font-sans">
              {language === 'ta'
                ? 'தமிழ்நாடு காவிரி டெல்டா மற்றும் பிற மாவட்ட நெல் விவசாயிகளுக்கான பயிர் நோயியல் மற்றும் காலநிலை அபாய நுண்ணறிவுச் சேவை.'
                : 'Agricultural pathology intelligence and micro-climate disease risk monitoring engineered specifically for paddy cultivation in Tamil Nadu.'}
            </p>
            <div className="text-xs font-mono text-[#4A584D]">
              {t('footerResources')}
            </div>
          </div>

          {/* Nav Links Col */}
          <div className="md:col-span-3 space-y-3">
            <div className="text-xs font-mono uppercase text-[#183B2A] font-semibold tracking-wider">
              Navigation
            </div>
            <ul className="space-y-2.5 text-sm font-sans text-[#202B22]">
              <li>
                <button
                  onClick={() => onNavigate('home')}
                  className="hover:text-[#183B2A] hover:underline cursor-pointer py-1"
                >
                  Overview & Homepage
                </button>
              </li>
              <li>
                <button
                  onClick={() => onNavigate('dashboard')}
                  className="hover:text-[#183B2A] hover:underline cursor-pointer font-medium text-[#183B2A] py-1"
                >
                  Farmer Workspace & Scanner
                </button>
              </li>
              <li>
                <a
                  href="#how-it-works"
                  className="hover:text-[#183B2A] hover:underline inline-block py-1"
                >
                  How It Works (4 Steps)
                </a>
              </li>
              <li>
                <a
                  href="#disease-intelligence"
                  className="hover:text-[#183B2A] hover:underline inline-block py-1"
                >
                  Common Rice Diseases
                </a>
              </li>
              <li>
                <a
                  href="#field-alerts"
                  className="hover:text-[#183B2A] hover:underline inline-block py-1"
                >
                  District Risk Registry
                </a>
              </li>
            </ul>
          </div>

          {/* Research & Extension Col */}
          <div className="md:col-span-4 space-y-3">
            <div className="text-xs font-mono uppercase text-[#183B2A] font-semibold tracking-wider">
              Agricultural Extension Directory
            </div>
            <div className="space-y-3 text-xs sm:text-sm text-[#4A584D] font-sans">
              <div>
                <span className="font-semibold text-[#183B2A] block">TNAU TRRI Aduthurai</span>
                <span>Tamil Nadu Rice Research Institute, Thanjavur District</span>
              </div>
              <div>
                <span className="font-semibold text-[#183B2A] block">KVK Sikkal, Nagapattinam</span>
                <span>ICAR - Krishi Vigyan Kendra Coastal Agro-Station</span>
              </div>
              <div className="p-3 bg-white border border-[#D9DED3] rounded-xs">
                <span className="font-semibold text-[#183B2A] block flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5 text-[#426B43]" />
                  <span>Kisan Call Centre (Free Toll-Free)</span>
                </span>
                <span className="font-mono text-sm font-semibold text-[#183B2A]">1800-180-1551</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Legal / Copyright Strip */}
        <div className="mt-14 pt-8 border-t border-[#D9DED3] flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs font-mono text-[#4A584D]">
          <div>{t('footerCopyright')}</div>
          <div className="flex items-center gap-5">
            <span>Privacy Policy</span>
            <span>·</span>
            <span>Terms of Advisory</span>
            <span>·</span>
            <span>TNAU Open Data Standards</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
