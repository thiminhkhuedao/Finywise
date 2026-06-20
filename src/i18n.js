import { I18n } from 'i18n-js';
import * as Localization from 'expo-localization';

const i18n = new I18n({
  en: {
    budget: 'Budget',
    goals: 'Goals',
    add: 'Add',
    income: 'Income',
  },

  fr: {
    budget: 'Budget',
    goals: 'Objectifs',
    add: 'Ajouter',
    income: 'Revenus',
  },
});

i18n.locale = Localization.getLocales()[0]?.languageCode || 'en';
i18n.enableFallback = true;

export default i18n;

import i18n from '../i18n';

<Text>{i18n.t('budget')}</Text>

import { useAppState } from './state';

i18n.locale = state.profile.language;