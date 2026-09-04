import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';

import en from './locales/en.json';
import fr from './locales/fr.json';

const LANG_STORAGE_KEY = '@finywise_language';
const SUPPORTED_LANGS = ['en', 'fr'];

const deviceLang = Localization.getLocales()[0]?.languageCode;
const initialLang = SUPPORTED_LANGS.includes(deviceLang) ? deviceLang : 'en';

i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    fallbackLng: 'en',
    lng: initialLang,

    resources: {
      en: {
        translation: en,
      },
      fr: {
        translation: fr,
      },
    },

    interpolation: {
      escapeValue: false,
    },
  });

// Si l'utilisateur a déjà choisi une langue manuellement, elle prime sur la
// langue du téléphone. Sinon, on garde la langue détectée à l'init.
AsyncStorage.getItem(LANG_STORAGE_KEY).then((savedLang) => {
  if (savedLang && savedLang !== i18n.language) {
    i18n.changeLanguage(savedLang);
  }
});

i18n.on('languageChanged', (lng) => {
  AsyncStorage.setItem(LANG_STORAGE_KEY, lng);
});

export default i18n;