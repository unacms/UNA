import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { resources } from '../translation';
import { storageGet, storageClear } from './util';
import { appSetting } from './util';

// Platform detection
const isWeb = typeof window !== 'undefined' && typeof navigator !== 'undefined';

// Get available languages from settings
function getAvailableLangs() {
  let langs = appSetting('dashboard', 'langs');
  if (!Array.isArray(langs) || langs.length === 0) langs = ['en'];
  return langs;
}

// Detect system/browser language (for instant switch)
export function detectSystemLanguage() {
  let lang = 'en';
  const availableLangs = getAvailableLangs();
  if (isWeb) {
    lang = navigator.language?.split('-')[0] || 'en';
  } else {
    try {
      const RNLocalize = require('react-native-localize');
      const locales = RNLocalize.getLocales();
      if (locales && locales.length > 0) {
        lang = locales[0].languageCode;
      }
    } catch (e) {}
  }
  if (!availableLangs.includes(lang)) {
    lang = availableLangs[0];
  }
  return lang;
}

// Language detector for i18n init
const languageDetector = {
  type: 'languageDetector',
  async: false,
  detect: (callback) => {
    let lang = 'en';
    let userLang = null;
    try {
      userLang = storageGet('layout:lang', '', true);
    } catch (e) {}
    const availableLangs = getAvailableLangs();
    if (userLang && userLang !== 'system') {
      lang = userLang;
    } else {
      lang = detectSystemLanguage();
    }
    callback(lang);
  },
  init: () => {},
  cacheUserLanguage: () => {},
};

if (!i18n.isInitialized) {
  i18n
    .use(initReactI18next)
    .use(languageDetector)
    .init({
      compatibilityJSON: 'v3',
      resources,
      lng: 'en', // default language
      fallbackLng: 'en',
      interpolation: {
        escapeValue: false,
      },
    });
}

export default i18n; 