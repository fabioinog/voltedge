/**
 * Language Context
 * Provides language state and translations throughout the app
 */

import React, { createContext, useContext, useState, useEffect } from 'react';
import { t as translateFunction } from '../utils/translations';

const LanguageContext = createContext({
  language: 'en',
  setLanguage: () => {},
  toggleLanguage: () => {},
  t: (key, params) => key,
});

export const LanguageProvider = ({ children }) => {
  const [language, setLanguage] = useState('en');

  // Load saved language preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('voltedge_language');
      if (saved && (saved === 'en' || saved === 'ar')) {
        setLanguage(saved);
      }
    }
  }, []);

  // Save language preference
  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('voltedge_language', language);
    }
  }, [language]);

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'en' ? 'ar' : 'en');
  };

  const translate = (key, params = {}) => {
    try {
      return translateFunction(key, language, params);
    } catch (error) {
      console.error('Translation error:', error, 'key:', key);
      return key; // Return key as fallback
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        toggleLanguage,
        t: translate,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
