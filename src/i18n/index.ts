import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import fr from './locales/fr.json';
import ar from './locales/ar.json';

const resources = {
  en: { translation: en },
  fr: { translation: fr },
  ar: { translation: ar },
};

// Safely get language code with fallback using require to avoid static import issues
let languageCode = 'en';
try {
  const Localization = require('expo-localization');
  const locales = Localization.getLocales();
  if (locales && locales.length > 0) {
    languageCode = locales[0].languageCode ?? 'en';
  }
} catch (e) {
  // Localization not available or native module missing
}

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: languageCode,
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false, // react already safes from xss
    },
  });

export default i18n;
