import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { motion } from 'motion/react';
import { sectionVariants, staggerContainer, itemVariants, defaultViewport } from '../../lib/motion';
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
    <motion.section
      id="how-it-works"
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={defaultViewport}
      className="py-20 border-b border-[#DCE4D9] bg-white"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="max-w-2xl mb-14">
          <span className="text-xs font-mono tracking-wider text-[#1F6B4A] uppercase block mb-3 font-semibold">
            {t('secB_eyebrow')}
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold font-['Manrope'] text-[#102D24] tracking-tight mb-4">
            {t('secB_title')}
          </h2>
          <p className="text-base sm:text-lg text-[#52665A] font-sans leading-relaxed">
            {t('secB_subtitle')}
          </p>
        </div>

        {/* 4-Step Visual Process Grid with Stagger */}
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={defaultViewport}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative"
        >
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <motion.div
                key={step.num}
                variants={itemVariants}
                className="relative flex flex-col p-6 bg-[#F5F3E9]/50 border border-[#DCE4D9] rounded-[14px] hover:border-[#1F6B4A] hover:shadow-sm transition-all"
              >
                {/* Step Top Bar */}
                <div className="flex items-center justify-between mb-5">
                  <span className="text-xs font-mono font-semibold text-[#1F6B4A] tracking-wider">
                    STEP {step.num}
                  </span>
                  <div className="w-10 h-10 rounded-[10px] bg-[#EAEFE5] flex items-center justify-center text-[#1F6B4A]">
                    <Icon className="w-5 h-5" />
                  </div>
                </div>

                {/* Step Title & Description */}
                <h3 className="text-lg font-bold text-[#102D24] mb-2.5">
                  {step.title}
                </h3>
                <p className="text-sm text-[#52665A] leading-relaxed font-sans mb-4">
                  {step.desc}
                </p>

                {/* Bottom Step Indicator Bar */}
                <div className="mt-auto pt-4 border-t border-[#DCE4D9] flex items-center justify-between text-[11px] font-mono text-[#718176]">
                  <span>PADDY FIELD PROTOCOL</span>
                  <span className="text-[#1F6B4A] font-semibold">{idx + 1} OF 4</span>
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </motion.section>
  );
};
