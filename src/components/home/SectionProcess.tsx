import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Camera, Cpu, CheckCircle2, ShieldAlert } from 'lucide-react';

export const SectionProcess: React.FC = () => {
  const { t } = useLanguage();

  const steps = [
    {
      num: '01',
      icon: Camera,
      title: t('secB_step1_title'),
      desc: t('secB_step1_desc'),
    },
    {
      num: '02',
      icon: Cpu,
      title: t('secB_step2_title'),
      desc: t('secB_step2_desc'),
    },
    {
      num: '03',
      icon: CheckCircle2,
      title: t('secB_step3_title'),
      desc: t('secB_step3_desc'),
    },
    {
      num: '04',
      icon: ShieldAlert,
      title: t('secB_step4_title'),
      desc: t('secB_step4_desc'),
    },
  ];

  return (
    <section id="how-it-works" className="py-20 border-b border-[#D9DED3] bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl mb-14">
          <span className="text-xs font-mono tracking-wider text-[#426B43] uppercase block mb-3 font-semibold">
            {t('secB_eyebrow')}
          </span>
          <h2 className="font-serif text-3xl sm:text-4xl text-[#183B2A] tracking-tight mb-4">
            {t('secB_title')}
          </h2>
          <p className="text-base sm:text-lg text-[#4A584D] font-sans leading-relaxed">
            {t('secB_subtitle')}
          </p>
        </div>

        {/* 4-Step Visual Process Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="relative flex flex-col p-6 bg-[#FAF9F3] border border-[#D9DED3] hover:border-[#183B2A] transition-colors"
              >
                {/* Step Top Bar */}
                <div className="flex items-center justify-between mb-5">
                  <span className="text-xs font-mono font-semibold text-[#183B2A] tracking-wider">
                    STEP {step.num}
                  </span>
                  <div className="w-9 h-9 rounded-xs bg-[#E5EBDD] flex items-center justify-center text-[#183B2A]">
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                </div>

                {/* Step Title & Description */}
                <h3 className="font-serif text-xl font-medium text-[#183B2A] mb-3">
                  {step.title}
                </h3>
                <p className="text-sm sm:text-base text-[#202B22]/90 leading-relaxed font-sans mb-4">
                  {step.desc}
                </p>

                {/* Bottom Step Indicator Bar */}
                <div className="mt-auto pt-4 border-t border-[#D9DED3]/60 flex items-center justify-between text-[11px] font-mono text-[#4A584D]">
                  <span>PADDY FIELD PROTOCOL</span>
                  <span className="text-[#426B43] font-semibold">{idx + 1} OF 4</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
