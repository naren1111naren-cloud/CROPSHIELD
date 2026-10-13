import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Languages, WifiOff, Smartphone, ShieldCheck } from 'lucide-react';

export const SectionBuiltForField: React.FC = () => {
  const { t } = useLanguage();

  const features = [
    {
      icon: Languages,
      title: t('secF_b1_title'),
      desc: t('secF_b1_desc'),
    },
    {
      icon: WifiOff,
      title: t('secF_b2_title'),
      desc: t('secF_b2_desc'),
    },
    {
      icon: Smartphone,
      title: t('secF_b3_title'),
      desc: t('secF_b3_desc'),
    },
    {
      icon: ShieldCheck,
      title: t('secF_b4_title'),
      desc: t('secF_b4_desc'),
    },
  ];

  return (
    <section id="about-system" className="py-20 border-b border-[#D9DED3] bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-14">
          <span className="text-xs font-mono tracking-wider text-[#426B43] uppercase block mb-3 font-semibold">
            {t('secF_eyebrow')}
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#183B2A] tracking-tight mb-4">
            {t('secF_title')}
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <div key={i} className="p-6 bg-[#FAF9F3] border border-[#D9DED3] flex flex-col justify-between shadow-2xs">
                <div>
                  <div className="w-10 h-10 rounded-xs bg-[#E5EBDD] flex items-center justify-center text-[#183B2A] mb-5">
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-serif text-lg sm:text-xl font-medium text-[#183B2A] mb-2.5">
                    {f.title}
                  </h3>
                  <p className="text-sm sm:text-base text-[#202B22]/90 leading-relaxed font-sans">
                    {f.desc}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-[#D9DED3]/60 text-xs font-mono text-[#4A584D]">
                  FIELD FEATURE 0{i + 1}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
