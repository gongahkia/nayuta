import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    fallbackLng: 'en',
    debug: false,
    interpolation: {
      escapeValue: false,
    },
    resources: {
      en: { translation: require('./locales/en/translation.json') },
      ms: { translation: require('./locales/ms/translation.json') },
      zh: { translation: require('./locales/zh/translation.json') },
      ta: { translation: require('./locales/ta/translation.json') },
      ja: { translation: require('./locales/ja/translation.json') },
      ko: { translation: require('./locales/ko/translation.json') }
    }
  });

export default i18n;