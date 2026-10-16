import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { Languages, WifiOff, Smartphone, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import {
  sectionVariants,
  staggerContainer,
  itemVariants,
  cardHoverTap,
  defaultViewport,
} from '../../lib/motion';

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
    <motion.section
      id="about-system"
      variants={sectionVariants}
      initial="hidden"
      whileInView="visible"
      viewport={defaultViewport}
      className="py-20 border-b border-[#DCE4D9] bg-white overflow-hidden"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-14">
          <span className="text-xs font-mono tracking-wider text-[#1F6B4A] uppercase block mb-3 font-semibold">
            {t('secF_eyebrow')}
          </span>
          <h2 className="text-3xl sm:text-4xl font-bold text-[#102D24] tracking-tight mb-4">
            {t('secF_title')}
          </h2>
        </div>

        <motion.div
          variants={staggerContainer}
          initial="hidden"
          whileInView="visible"
          viewport={defaultViewport}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
        >
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={i}
                variants={itemVariants}
                {...cardHoverTap}
                className="p-6 bg-[#F5F3E9]/50 border border-[#DCE4D9] rounded-[14px] flex flex-col justify-between shadow-2xs hover:border-[#1F6B4A] transition-all cursor-pointer"
              >
                <div>
                  <motion.div
                    whileHover={{ scale: 1.15, rotate: 6 }}
                    transition={{ type: 'spring', stiffness: 400, damping: 20 }}
                    className="w-10 h-10 rounded-[10px] bg-[#EAEFE5] flex items-center justify-center text-[#1F6B4A] mb-5 shadow-2xs"
                  >
                    <Icon className="w-5 h-5" />
                  </motion.div>
                  <h3 className="text-lg font-bold text-[#102D24] mb-2.5">
                    {f.title}
                  </h3>
                  <p className="text-sm text-[#52665A] leading-relaxed font-sans">
                    {f.desc}
                  </p>
                </div>
                <div className="mt-6 pt-4 border-t border-[#DCE4D9] text-xs font-mono text-[#718176]">
                  FIELD FEATURE 0{i + 1}
                </div>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </motion.section>
  );
};
