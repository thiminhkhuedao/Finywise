import React from 'react';
import { View, Text, ScrollView, StyleSheet, Share } from 'react-native';
import { useAppState, useComputed } from '../state';
import { Card, SectionTitle, Button } from '../components/UI';
import { colors, spacing, radius } from '../theme';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

export default function ReportScreen({ navigation }) {
  const { state } = useAppState();
  const { fmt, totalSpent, availableBalance, savingsAmount, healthScore } = useComputed();
  const { budgets, transactions, savingsGoals, streak, profile } = state;
  const { t } = useTranslation();

  const inc = profile.monthlyIncome || 1;
  const spent = totalSpent;
  const saved = savingsAmount;
  const spentR = Math.round(spent/inc*100);
  const savR = Math.round(saved/inc*100);
  const cats = budgets.filter(b=>b.spent>0).sort((a,b)=>b.spent-a.spent);
  const txCount = transactions.filter(t=>t.type==='expense').length;
  const avgTx = txCount ? spent/txCount : 0;
  const goalsMet = (savingsGoals||[]).filter(g=>g.completed).length;
  const monthName = new Date().toLocaleString('default',{month:'long',year:'numeric'});

  let insight = '';
  if (spentR > 90) insight = t('report.insightSpent', { percent: spentR });
  else if (savR >= profile.savingsGoal) insight = t('report.insightSaved', { goal: profile.savingsGoal, amount: fmt(saved),});
  else if (cats.length) insight = t('report.insightCategory', { category: cats[0].name, amount: fmt(cats[0].spent),});
  else insight = t('report.insightEmpty');

  const handleShare = async () => {
    const text = t('report.shareText', {
  month: monthName,
  income: fmt(inc),
  spent: fmt(spent),
  spentPercent: spentR,
  saved: fmt(saved),
  savedPercent: savR,
  transactions: txCount,
  streak: (streak || {}).current || 0,
  insight,
});
    await Share.share({ message: text });
  };

  const pct = (a,b) => !b ? 0 : Math.min(100,Math.round((a/b)*100));

  return (
  <SafeAreaView style={s.container} edges={['top']}>
    <ScrollView
      contentContainerStyle={s.scroll}
      showsVerticalScrollIndicator={false}
    >
      <View style={s.headerRow}>
        <Text style={s.title}>{t('report.title')}</Text>
        <Button label={t('report.share')} variant="secondary" size="sm" onPress={handleShare}/>
      </View>

      <View style={s.reportCard}>
        <View style={s.reportHeader}>
          <Text style={s.reportLogo}>Finy<Text style={{color:colors.accent}}>Wise</Text></Text>
          <Text style={s.reportMonth}>{t('report.summary', { month: monthName })}</Text>
          <View style={s.summaryRow}>
            <View style={s.summaryItem}>
              <Text style={s.summaryLabel}>{t('report.income')}</Text>
              <Text style={s.summaryVal}>{fmt(inc)}</Text>
            </View>
            <View style={s.summaryItem}>
              <Text style={s.summaryLabel}>{t('report.spent')}</Text>
              <Text style={[s.summaryVal,{color:colors.danger}]}>{fmt(spent)}</Text>
            </View>
            <View style={s.summaryItem}>
              <Text style={s.summaryLabel}>{t('report.saved')}</Text>
              <Text style={[s.summaryVal,{color:colors.success}]}>{fmt(saved)}</Text>
            </View>
          </View>
        </View>

        <View style={s.reportBody}>
          <View style={s.statGrid}>
            <View style={s.statCard}>
              <Text style={[s.statNum,{color:spentR>80?colors.danger:spentR>60?colors.warning:colors.text}]}>{spentR}%</Text>
              <Text style={s.statLabel}>{t('report.ofIncomeSpent')}</Text>
            </View>
            <View style={s.statCard}>
              <Text style={[s.statNum,{color:savR>=profile.savingsGoal?colors.success:colors.warning}]}>{savR}%</Text>
              <Text style={s.statLabel}>{t('report.savingsRate')}</Text>
            </View>
            <View style={s.statCard}>
              <Text style={s.statNum}>{txCount}</Text>
              <Text style={s.statLabel}>{t('report.transactions')}</Text>
            </View>
            <View style={s.statCard}>
              <Text style={s.statNum}>{fmt(avgTx)}</Text>
              <Text style={s.statLabel}>{t('report.averageTransaction')}</Text>
            </View>
          </View>

          {cats.length > 0 && (
            <>
              <Text style={s.sectionLabel}>{t('report.byCategory')}</Text>
              {cats.slice(0,5).map(b => {
                const p = pct(b.spent, inc);
                return (
                  <View key={b.id} style={{marginBottom:10}}>
                    <View style={{flexDirection:'row',justifyContent:'space-between',marginBottom:4}}>
                      <Text style={{fontSize:13,color:colors.text}}>{b.icon} {b.key ? t(`budget.${b.key}`) : b.name}</Text>
                      <Text style={{fontSize:12,color:colors.muted}}>{t('report.categoryAmount', {amount: fmt(b.spent), percent: p,})}</Text>
                    </View>
                    <View style={s.progressWrap}>
                      <View style={[s.progressBar,{width:`${p}%`,backgroundColor:b.color}]}/>
                    </View>
                  </View>
                );
              })}
            </>
          )}

          {(streak||{}).current > 0 && (
            <View style={s.streakBox}>
              <Text style={{fontSize:28}}>🔥</Text>
              <View>
              <Text style={{fontSize:13,fontWeight:'600',color:colors.text}}>{t('report.streakTitle', {days: streak.current,})}</Text>
                <Text style={{fontSize:11,color:colors.muted}}>{t('report.streakSubtitle', {days: streak.current,})}</Text>
              </View>
            </View>
          )}

          {goalsMet > 0 && (
            <View style={s.goalsBox}>
              <Text style={{fontSize:24}}>🎯</Text>
              <Text style={{fontSize:13,fontWeight:'600',color:colors.success,marginTop:4}}>{t('report.goalsCompleted', {count: goalsMet,})}</Text>
            </View>
          )}

          <View style={s.insightBox}>
            <Text style={{fontSize:13,color:colors.muted,lineHeight:20}}>{insight}</Text>
          </View>
        </View>
      </View>
        </ScrollView>
  </SafeAreaView>
);
}

const s = StyleSheet.create({
  container: { flex:1, backgroundColor:colors.bg },
  scroll: {
  padding: spacing.xl,
  paddingTop: spacing.xl + 8,
  paddingBottom: 40,
},
  headerRow: { flexDirection:'row', alignItems:'center', justifyContent:'space-between', marginBottom:16 },
  title: { fontSize:22, fontWeight:'700', color:colors.text },
  reportCard: { backgroundColor:colors.surface, borderWidth:1, borderColor:colors.border, borderRadius:radius.md, overflow:'hidden' },
  reportHeader: { backgroundColor:'#1e1a3a', padding:20, borderBottomWidth:1, borderBottomColor:colors.border },
  reportLogo: { fontSize:16, fontWeight:'800', color:colors.text, marginBottom:4 },
  reportMonth: { fontSize:12, color:colors.muted },
  summaryRow: { flexDirection:'row', gap:20, marginTop:14 },
  summaryItem: {},
  summaryLabel: { fontSize:10, color:colors.muted },
  summaryVal: { fontSize:14, fontWeight:'600', color:colors.text, marginTop:2 },
  reportBody: { padding:16 },
  statGrid: { flexDirection:'row', flexWrap:'wrap', gap:10, marginBottom:16 },
  statCard: { flex:1, minWidth:'44%', backgroundColor:colors.surface2, borderRadius:10, padding:12, alignItems:'center' },
  statNum: { fontSize:22, fontWeight:'700', color:colors.text },
  statLabel: { fontSize:11, color:colors.muted, marginTop:2, textAlign:'center' },
  sectionLabel: { fontSize:11, fontWeight:'600', color:colors.muted, textTransform:'uppercase', letterSpacing:1, marginBottom:10 },
  progressWrap: { backgroundColor:colors.surface2, borderRadius:100, height:6, overflow:'hidden' },
  progressBar: { height:'100%', borderRadius:100 },
  streakBox: { flexDirection:'row', alignItems:'center', gap:12, backgroundColor:'rgba(124,106,247,0.08)', borderWidth:1, borderColor:'rgba(124,106,247,0.2)', borderRadius:10, padding:12, marginTop:12 },
  goalsBox: { backgroundColor:'rgba(72,187,120,0.08)', borderWidth:1, borderColor:'rgba(72,187,120,0.25)', borderRadius:10, padding:12, marginTop:10, alignItems:'center' },
  insightBox: { backgroundColor:'rgba(124,106,247,0.07)', borderWidth:1, borderColor:'rgba(124,106,247,0.2)', borderRadius:10, padding:12, marginTop:12 },
});
