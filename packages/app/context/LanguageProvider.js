import React, { createContext, useEffect, useState } from 'react';
import i18n from 'app/lib/i18n';

export const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  // Initialize with explicit English fallback to prevent race conditions
  const [lang, setLang] = useState(i18n.language || 'en');

  useEffect(() => {
    // Ensure language is properly set on mount
    if (i18n.isInitialized && i18n.language) {
      setLang(i18n.language);
    }
    
    const onLangChange = (lng) => setLang(lng);
    i18n.on('languageChanged', onLangChange);
    return () => i18n.off('languageChanged', onLangChange);
  }, []);

  return (
    <LanguageContext.Provider value={lang}>
      {children}
    </LanguageContext.Provider>
  );
} 