import React, { createContext, useEffect, useState } from 'react';
import i18n from 'app/lib/i18n';

export const LanguageContext = createContext();

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(i18n.language);

  useEffect(() => {
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