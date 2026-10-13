import React, { createContext, useContext, useState, useEffect } from 'react';
import { translations, TranslationKey } from '../i18n/translations';
import { Language } from '../types';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const stored = localStorage.getItem('cropshield_lang');
      if (stored === 'en' || stored === 'ta') return stored;
    } catch {
      // Ignore localStorage access failures
    }
    return 'en';
  });

  useEffect(() => {
    try {
      localStorage.setItem('cropshield_lang', language);
    } catch {
      // Ignore
    }
    document.documentElement.lang = language;
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const toggleLanguage = () => {
    setLanguageState((prev) => (prev === 'en' ? 'ta' : 'en'));
  };

  const t = (key: TranslationKey): string => {
    const dict = translations[language] || translations.en;
    return (dict[key] as string) || (translations.en[key] as string) || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
