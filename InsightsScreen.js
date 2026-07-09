import React from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppState, useComputed } from '../state';
import { Card, SectionTitle, Button, Empty, TipBox } from '../components/UI';
import { colors, spacing } from '../theme';
import { useTranslation } from 'react-i18next';

export default function InsightsScreen() {
  const { state, dispatch } = useAppState();
  const { totalSpent, availableBalance, savingsAmount, healthScore, fmt, pct } = useComputed();
  const { budgets, transactions, profile, streak } = state;
  const income = profile.monthlyIncome || 1;
  const spentR = Math.round(totalSpent / income * 100);
  const savR   = Math.round(savingsAmount / income * 100);
  const cats   = budgets.filter(b => b.allocated > 0);
  const maxVal = Math.max(...cats.map(b => b.spent), 1);
  const { t } = useTranslation();

  const tips = [];
  budgets.forEach(b => { const p = pct(b.spent, b.allocated); if (p >= 90) tips.push(t('insights.budgetWarning', {category: b.key ? t(`budget.${b.key}`) : b.name, percent: p,})); });
  if (savR < profile.savingsGoal) tips.push(t('insights.savingWarning', {current: savR, goal: profile.savingsGoal,}));
  if (!tips.length) tips.push(t('insights.good'));

  const txByDay = {};
  transactions.filter(t => t.type === 'expense').forEach(t => { txByDay[t.date] = (txByDay[t.date]||0) + t.amount; });
  const topDays = Object.entries(txByDay).sort((a,b) => b[1]-a[1]).slice(0,3);

  const scoreColor = healthScore >= 70 ? colors.success : healthScore >= 40 ? colors.warning : colors.danger;

  return (
  <SafeAreaView style={s.container} edges={['top']}>
    <ScrollView
      contentContainerStyle={s.scroll}
      showsVerticalScrollIndicator={false}
    >
      <Text style={s.title}>{t('insights.title')}</Text>
      <Text style={s.sub}>{t('insights.subtitle')}</Text>

      <View style={s.statGrid}>
        {[
          [spentR+'%', t('insights.incomeSpent'), spentR>80?colors.danger:spentR>60?colors.warning:colors.text],
          [savR+'%', t('insights.savingGoal', {goal: profile.savingsGoal}), savR>=profile.savingsGoal?colors.success:colors.warning],
          [transactions.length+'', t('insights.transactions'), colors.text],
          [streak.current+'🔥', t('insights.dayStreak'), colors.accent],
        ].map(([n,l,c]) => (
          <View key={l} style={s.statCard}>
            <Text style={[s.statNum, { color: c }]}>{n}</Text>
            <Text style={s.statLbl}>{l}</Text>
          </View>
        ))}
      </View>

      {cats.length > 0 && (
        <>
          <SectionTitle>{t('insights.byCategory')}</SectionTitle>
          <Card>
            <View style={s.barChart}>
              {cats.map(b => {
                const h = Math.max(4, Math.round((b.spent / maxVal) * 80));
                return (
                  <View key={b.id} style={s.barCol}>
                    {b.spent > 0 && <Text style={s.barVal}>{fmt(b.spent)}</Text>}
                    <View style={[s.barBody, { height: h, backgroundColor: b.color }]}/>
                    <Text style={s.barLbl}>{b.icon}</Text>
                  </View>
                );
              })}
            </View>
            <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 12 }}/>
            {cats.map(b => (
              <View key={b.id} style={s.catRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                  <View style={{ width: 9, height: 9, borderRadius: 2, backgroundColor: b.color }}/>
                  <Text style={{ fontSize: 12, color: colors.text }}>{b.key ? t(`budget.${b.key}`) : b.name}</Text>
                </View>
                <Text style={{ fontSize: 12, fontWeight: '500', color: colors.text }}>
                  {fmt(b.spent)} <Text style={{ color: colors.muted, fontWeight: '400' }}>/ {fmt(b.allocated)}</Text>
                </Text>
              </View>
            ))}
          </Card>
        </>
      )}

      {topDays.length > 0 && (
        <>
          <SectionTitle>{t('insights.topDays')}</SectionTitle>
          <Card style={{ paddingVertical: 8 }}>
            {topDays.map(([date, amt], i) => (
              <View key={date} style={s.dayRow}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <View style={{ width: 24, height: 24, borderRadius: 6, backgroundColor: colors.accent+(i===0?'33':'18'), alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: colors.accent }}>{i+1}</Text>
                  </View>
                  <Text style={{ fontSize: 13, color: colors.text }}>{date}</Text>
                </View>
                <Text style={{ fontWeight: '600', fontSize: 13, color: colors.danger }}>{fmt(amt)}</Text>
              </View>
            ))}
          </Card>
        </>
      )}

      <SectionTitle>{t('insights.smartTips')}</SectionTitle>
      {tips.map((t, i) => <TipBox key={i}>{t}</TipBox>)}

      <Button label={t('insights.reset')} variant="danger" style={{ marginTop: 20 }}
        onPress={() => Alert.alert(t('insights.resetQuestion'),'', [{text: t('common.cancel'),style: 'cancel'}, {text: t('insights.reset'), style: 'destructive',onPress: () => dispatch({ type: 'RESET' })    }])}/>
        </ScrollView>
  </SafeAreaView>
);
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: {
  padding: spacing.xl,
  paddingTop: spacing.xl + 8,
  paddingBottom: 40,
},
  title:     { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 4 },
  sub:       { fontSize: 12, color: colors.muted, marginBottom: 18 },
  statGrid:  { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 },
  statCard:  { flex: 1, minWidth: '44%', backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: 12, padding: 14, alignItems: 'center' },
  statNum:   { fontSize: 22, fontWeight: '700' },
  statLbl:   { fontSize: 11, color: colors.muted, marginTop: 2, textAlign: 'center' },
  barChart:  { flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 100, marginVertical: 8 },
  barCol:    { flex: 1, alignItems: 'center', gap: 3, justifyContent: 'flex-end' },
  barBody:   { width: '100%', borderRadius: 5 },
  barVal:    { fontSize: 8, color: colors.text, fontWeight: '500' },
  barLbl:    { fontSize: 9, color: colors.muted },
  catRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: colors.border },
  dayRow:    { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: colors.border },
});
