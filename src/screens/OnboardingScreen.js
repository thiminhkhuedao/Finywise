import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppState, uid } from '../state';
import { Input, Button, Card } from '../components/UI';
import { colors, spacing, radius } from '../theme';
import { useTranslation } from 'react-i18next';


export default function OnboardingScreen({ navigation }) {
  const { dispatch } = useAppState();
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('€');
  const [income, setIncome] = useState('');
  const [savingsGoal, setSavingsGoal] = useState('20');

  const currencies = ['€','$','£','¥'];

const submit = () => {
  if (!name.trim()) return Alert.alert(t('onboarding.enterName'));

  const inc = parseFloat(income) || 0;

  const profile = {
    name: name.trim(),
    currency,
    monthlyIncome: inc,
    savingsGoal: parseFloat(savingsGoal) || 20,
  };

  dispatch({ type: 'SET_PROFILE', payload: profile });

  [
    ['housing', '🏠', 0.35, '#7c6af7'],
    ['food', '🍔', 0.15, '#4fd1c5'],
    ['transport', '🚌', 0.10, '#ed8936'],
    ['fun', '🎮', 0.10, '#48bb78'],
  ].forEach(([key, icon, ratio, color]) =>
    dispatch({
      type: 'ADD_BUDGET',
      payload: {
        id: uid(),
        key,
        icon,
        allocated: inc * ratio,
        spent: 0,
        color,
      },
    })
  );
};

  return (
  <SafeAreaView style={s.container} edges={['top']}>
    <ScrollView
      contentContainerStyle={s.scroll}
      showsVerticalScrollIndicator={false}
    >
      <View style={s.hero}>
        <Text style={s.icon}>✦</Text>
        <Text style={s.title}>{t('onboarding.welcome')}</Text>
        <Text style={s.sub}>{t('onboarding.subtitle')}</Text>
      </View>
      <Card>
        <Input label={t('onboarding.name')} value={name} onChangeText={setName} placeholder={t('onboarding.namePlaceholder')}/>
        <Text style={s.label}>{t('onboarding.currency')}</Text>
        <View style={s.currencyRow}>
          {currencies.map(c => (
            <TouchableOpacity key={c} style={[s.currencyBtn, currency===c && s.currencyBtnActive]} onPress={() => setCurrency(c)}>
              <Text style={[s.currencyText, currency===c && s.currencyTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Input label={t('onboarding.income')} value={income} onChangeText={setIncome} keyboardType="numeric" placeholder="2000"/>
        <Input label={t('onboarding.savingsGoal')} value={savingsGoal} onChangeText={setSavingsGoal} keyboardType="numeric" placeholder="20"/>
        <Button label={t('onboarding.start')} onPress={submit}/>
      </Card>
      <Text style={s.note}> {t('onboarding.note')}</Text>
        </ScrollView>
  </SafeAreaView>
);
}

const s = StyleSheet.create({
  container:           { flex: 1, backgroundColor: colors.bg },
  scroll: {
  padding: spacing.xl,
  paddingTop: spacing.xl + 8,
  paddingBottom: 40,
},
  hero:                { alignItems: 'center', marginBottom: 28 },
  icon:                { fontSize: 52, marginBottom: 14 },
  title:               { fontSize: 26, fontWeight: '700', color: colors.text, marginBottom: 8, textAlign: 'center' },
  sub:                 { fontSize: 14, color: colors.muted, lineHeight: 22, textAlign: 'center' },
  label:               { fontSize: 12, color: colors.muted, marginBottom: 8, marginTop: 4 },
  currencyRow:         { flexDirection: 'row', gap: 10, marginBottom: 16 },
  currencyBtn:         { flex: 1, paddingVertical: 10, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, alignItems: 'center', backgroundColor: colors.surface2 },
  currencyBtnActive:   { borderColor: colors.accent, backgroundColor: colors.accent + '22' },
  currencyText:        { fontSize: 16, color: colors.muted },
  currencyTextActive:  { color: colors.accent, fontWeight: '600' },
  note:                { textAlign: 'center', fontSize: 11, color: colors.muted, marginTop: 14 },
});
