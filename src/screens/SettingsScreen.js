import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppState } from '../state';
import { Input, Button, Card } from '../components/UI';
import { colors, spacing, radius } from '../theme';
import i18n from '../i18n';
import { useTranslation } from 'react-i18next';

export default function SettingsScreen() {
  const { state, dispatch } = useAppState();
  const { t } = useTranslation();

  const [name, setName] = useState(state.profile.name || '');
  const [currency, setCurrency] = useState(state.profile.currency || '€');
  const [income, setIncome] = useState(String(state.profile.monthlyIncome ?? ''));
  const [savingsGoal, setSavingsGoal] = useState(String(state.profile.savingsGoal ?? ''));

  const currencies = ['€', '$', '£', '¥'];

  const saveProfile = () => {
    if (!name.trim()) return Alert.alert(t('settings.profile.enterName'));

    dispatch({
      type: 'SET_PROFILE',
      payload: {
        name: name.trim(),
        currency,
        monthlyIncome: parseFloat(income) || 0,
        savingsGoal: parseFloat(savingsGoal) || 0,
      },
    });

    Alert.alert(t('settings.profile.saved'));
  };

  const setLanguage = (language) => {
    i18n.changeLanguage(language);

    dispatch({
      type: 'SET_PROFILE',
      payload: {
        ...state.profile,
        language,
      },
    });
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <ScrollView
        contentContainerStyle={s.scroll}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.title}>{t('settings.title')}</Text>
        <Text style={s.sub}>{t('settings.subtitle')}</Text>

        <Text style={s.section}>{t('settings.profile.title')}</Text>
        <Card>
          <Input
            label={t('settings.profile.name')}
            value={name}
            onChangeText={setName}
            placeholder={t('onboarding.namePlaceholder')}
          />

          <Text style={s.label}>{t('settings.profile.currency')}</Text>
          <View style={s.currencyRow}>
            {currencies.map(c => (
              <TouchableOpacity
                key={c}
                style={[s.currencyBtn, currency === c && s.currencyBtnActive]}
                onPress={() => setCurrency(c)}
              >
                <Text style={[s.currencyText, currency === c && s.currencyTextActive]}>{c}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Input
            label={t('settings.profile.income')}
            value={income}
            onChangeText={setIncome}
            keyboardType="numeric"
            placeholder="2000"
          />
          <Input
            label={t('settings.profile.savingsGoal')}
            value={savingsGoal}
            onChangeText={setSavingsGoal}
            keyboardType="numeric"
            placeholder="20"
          />

          <Button label={t('settings.profile.save')} onPress={saveProfile} style={{ marginTop: 4 }}/>
        </Card>

        <Text style={s.section}>{t('settings.language')}</Text>

        <TouchableOpacity
          style={[
            s.card,
            state.profile.language === 'fr' && s.cardActive,
          ]}
          onPress={() => setLanguage('fr')}
        >
          <Text style={s.flag}>🇫🇷</Text>

          <View style={{ flex: 1 }}>
            <Text style={s.label}>Français</Text>
            <Text style={s.desc}>Langue française</Text>
          </View>

          {state.profile.language === 'fr' && (
            <Text style={s.check}>✓</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            s.card,
            state.profile.language === 'en' && s.cardActive,
          ]}
          onPress={() => setLanguage('en')}
        >
          <Text style={s.flag}>🇬🇧</Text>

          <View style={{ flex: 1 }}>
            <Text style={s.label}>English</Text>
            <Text style={s.desc}>English language</Text>
          </View>

          {state.profile.language === 'en' && (
            <Text style={s.check}>✓</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },

  scroll: {
    padding: spacing.xl,
    paddingTop: spacing.xl + 8,
    paddingBottom: 40,
  },

  title: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },

  sub: {
    fontSize: 13,
    color: colors.muted,
    marginBottom: 24,
  },

  section: {
    fontSize: 12,
    color: colors.muted,
    marginBottom: 10,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    padding: 14,
    marginBottom: 10,
  },

  cardActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accent + '15',
  },

  flag: {
    fontSize: 24,
    marginRight: 14,
  },

  label: {
    fontSize: 12,
    color: colors.muted,
    marginBottom: 8,
    marginTop: 4,
  },

  desc: {
    fontSize: 12,
    color: colors.muted,
    marginTop: 2,
  },

  check: {
    fontSize: 20,
    color: colors.accent,
    fontWeight: '700',
  },

  currencyRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },

  currencyBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    backgroundColor: colors.surface2,
  },

  currencyBtnActive: {
    borderColor: colors.accent,
    backgroundColor: colors.accent + '22',
  },

  currencyText: {
    fontSize: 16,
    color: colors.muted,
  },

  currencyTextActive: {
    color: colors.accent,
    fontWeight: '600',
  },
});