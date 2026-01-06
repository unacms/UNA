// Smart stub for react-native-localize that uses browser locale on web
const getBrowserLocale = () => {
    if (typeof navigator === 'undefined') {
      // Server-side fallback
      return { languageCode: 'en', countryCode: 'US', languageTag: 'en-US', isRTL: false };
    }
    
    // Client-side: get real browser locale
    const locale = navigator.language || navigator.userLanguage || 'en-US';
    const [languageCode, countryCode] = locale.split('-');
    
    return {
      languageCode: languageCode || 'en',
      countryCode: countryCode?.toUpperCase() || 'US',
      languageTag: locale,
      isRTL: false,
    };
  };
  
  export const getLocales = () => [getBrowserLocale()];
  
  export const findBestLanguageTag = (languageTags) => {
    const browserLocale = getBrowserLocale();
    // Try to find matching language tag
    const match = languageTags?.find(tag => 
      tag.toLowerCase() === browserLocale.languageTag.toLowerCase()
    );
    return {
      languageTag: match || languageTags?.[0] || browserLocale.languageTag,
      isRTL: false,
    };
  };
  
  export const getNumberFormatSettings = () => {
    if (typeof Intl === 'undefined') {
      return { decimalSeparator: '.', groupingSeparator: ',' };
    }
    
    // Get real browser number format
    const formatter = new Intl.NumberFormat(navigator.language);
    const parts = formatter.formatToParts(1234.5);
    
    return {
      decimalSeparator: parts.find(p => p.type === 'decimal')?.value || '.',
      groupingSeparator: parts.find(p => p.type === 'group')?.value || ',',
    };
  };
  
  export const uses24HourClock = () => {
    if (typeof Intl === 'undefined') return false;
    const locale = navigator.language || 'en-US';
    const formatter = new Intl.DateTimeFormat(locale, { hour: 'numeric' });
    const parts = formatter.formatToParts(new Date(2020, 0, 1, 13));
    return !parts.some(part => part.type === 'dayPeriod');
  };
  
  export default { 
    getLocales, 
    findBestLanguageTag,
    getNumberFormatSettings,
    uses24HourClock,
  };    