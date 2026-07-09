import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAppState, useComputed, uid } from '../state';
import { Card, SectionTitle, Button, Input, Row, Empty } from '../components/UI';
import { colors, spacing, radius } from '../theme';


export default function DecideScreen() {
  const {t} = useTranslation();
  const { state, dispatch } = useAppState();
  const { availableBalance, savingsAmount, fmt } = useComputed();
  const { budgets, priceWatchlist } = state;
  const [tab, setTab] = useState('activity');
  const [result, setResult] = useState(null);
  const [actName, setActName] = useState('');
  const [actCost, setActCost] = useState('');
  const [actCatId, setActCatId] = useState('');
  const [purName, setPurName] = useState('');
  const [purPrice, setPurPrice] = useState('');
  const [urgency, setUrgency] = useState('flexible');
  const [pwProd, setPwProd] = useState('');
  const [pwCur, setPwCur] = useState('');
  const [pwTgt, setPwTgt] = useState('');
  const [pwStore, setPwStore] = useState('');

  const income = state.profile.monthlyIncome || 1;

  const analyzeActivity = () => {
    const cost = parseFloat(actCost) || 0;
    if (!actName.trim()) return Alert.alert(t('decide.enterActivity'));
    const cat = budgets.find(b => b.id === actCatId);
    const catRem = cat ? cat.allocated - cat.spent : Infinity;
    let v, type, msg;
    if (cost === 0) { v = t('decide.freeTitle'); type='yes'; msg = t('decide.freeMessage'); }
    else if (availableBalance <= 0) { v = t('decide.notReccomended'); type='no'; msg=  t('decide.overBudget', { amount: fmt(Math.abs(availableBalance))}); }
    else if (cost > availableBalance) { v = t('decide.cannotAfford'); type='no'; msg=t('decide.cannotAffordMessage', {cost: fmt(cost), remaining: fmt(availableBalance)});}
    else if (cat && cost > catRem) { v = t('decide.categoryLimit'); type='maybe'; msg=t('decide.categoryMessage', { remaining: fmt(catRem), category: cat?.key ? t(`budget.${cat.key}`)  : cat?.name });}
    else if (cost / income > 0.15) { v = t('decide.thinkTwice'); type='maybe'; msg= t('decide.incomeMessage', { cost: fmt(cost) });}
    else { v = t('decide.goForIt'); type='yes'; msg=t('decide.goForItMessage', { remaining: fmt(availableBalance - cost) });}
    setResult({ v, type, msg });
  };

  const analyzePurchase = () => {
    const price = parseFloat(purPrice) || 0;
    if (!purName.trim()) return Alert.alert(t('decide.enterProduct'));
    let v, type, msg;
    if (price > availableBalance && urgency !== 'urgent') {
      const mo = Math.ceil(price / Math.max(1, savingsAmount));
      v = t('decide.waitForDrop'); type='no'; msg= t('decide.affordInMonths', {  count: mo, months: mo,});
    } else if (price > availableBalance) {
      v = t('decide.tight'); type='maybe'; msg=t('decide.shortBy', {amount: fmt(price - availableBalance),});
    } else if (price / income > 0.3 && urgency === 'flexible') {
      v = t('decide.considerWaiting'); type='maybe'; msg=t('decide.highIncomePercent', { price: fmt(price),   percent: Math.round((price / income) * 100),  });
    } else {
      v = ('decide.goodToGo'); type='yes'; msg=t('decide.canAffordProduct', { product: purName,  amount: fmt(availableBalance - price), });}
    setResult({ v, type, msg });
  };

  const addPriceWatch = () => {
    const cur = parseFloat(pwCur) || 0, tgt = parseFloat(pwTgt) || 0;
    if (!pwProd.trim()) return Alert.alert(t('decide.enterProduct'));
    const diff = cur - tgt, pct = tgt > 0 ? Math.round((diff/cur)*100) : 0;
    const canNow = cur <= availableBalance, canTgt = tgt <= availableBalance;
    let tip;
    if (canNow && cur <= tgt) tip = t('decide.watch.canNow');
    else if (!canNow && !canTgt) tip = t('decide.watch.cannotTarget', {target: fmt(tgt)  });
    else if (diff > 0) tip = t('decide.watch.wait', {percent: pct, savings: fmt(diff), advice: canTgt  ? t('decide.watch.affordTarget') : t('decide.watch.keepSaving')  });
    else tip = t('decide.watch.belowTarget', {  advice: canNow  ? t('decide.watch.buyNow')  : t('decide.watch.almostThere')  });
    dispatch({ type: 'ADD_PRICE_WATCH', payload: { id: uid(), product: pwProd, currentPrice: cur, targetPrice: tgt, store: pwStore||'Any', tip } });
    setPwProd(''); setPwCur(''); setPwTgt(''); setPwStore('');
    Alert.alert(t('decide.addedWatchlist'));
  };

  const resultColors = { yes: colors.success, no: colors.danger, maybe: colors.warning };

  return (
  <SafeAreaView style={s.container} edges={['top']}>
    <ScrollView
      contentContainerStyle={s.scroll}
      showsVerticalScrollIndicator={false}
    >
      <Text style={s.title}>{t('decide.title')}</Text>
      <Text style={s.sub}>{t('decide.subtitle')}</Text>

      <View style={s.tabs}>
        {[['activity','🎯' + t('decide.activity')],['purchase','🛒' + t('decide.purchase')],['price','📈' + t('decide.watchlist')]].map(([t,l]) => (
          <TouchableOpacity key={t} style={[s.tab, tab===t&&s.tabActive]} onPress={() => { setTab(t); setResult(null); }}>
            <Text style={[s.tabText, tab===t&&s.tabTextActive]}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'activity' && (
        <Card>
          <Input label={t('decide.activityQuestion')} value={actName} onChangeText={setActName} placeholder={t('decide.activityPlaceholder')}/>
          <Input label={t('decide.estimatedCost')} value={actCost} onChangeText={setActCost} keyboardType="numeric" placeholder="0"/>
          <Button label={t('decide.analyze')} onPress={analyzeActivity}/>
        </Card>
      )}

      {tab === 'purchase' && (
        <Card>
          <Input label={t('decide.buyQuestion')} value={purName} onChangeText={setPurName} placeholder={t('decide.productPlaceholder')}/>
          <Input label={t('decide.price')} value={purPrice} onChangeText={setPurPrice} keyboardType="numeric" placeholder="0"/>
          <Text style={s.label}>{t('decide.canWait')}</Text>
          <Row style={{ gap: 8, marginBottom: 16 }}>
            {[['flexible',t('decide.flexible')],['soon',t('decide.soon')],['urgent',t('decide.urgent')]].map(([u,l]) => (
              <TouchableOpacity key={u} style={[s.urgencyBtn, urgency===u&&s.urgencyBtnActive]} onPress={() => setUrgency(u)}>
                <Text style={[s.urgencyText, urgency===u&&s.urgencyTextActive]}>{l}</Text>
              </TouchableOpacity>
            ))}
          </Row>
          <Button label="Analyze ✦" onPress={analyzePurchase}/>
        </Card>
      )}

      {tab === 'price' && (
        <>
          <Card>
            <Input label={t('decide.productName')} value={pwProd} onChangeText={setPwProd} placeholder="e.g. MacBook Air M3"/>
            <Row style={{ gap: 10 }}>
              <View style={{ flex: 1 }}><Input label={t('decide.currentPrice')} value={pwCur} onChangeText={setPwCur} keyboardType="numeric" placeholder="0"/></View>
              <View style={{ flex: 1 }}><Input label={t('decide.targetPrice')} value={pwTgt} onChangeText={setPwTgt} keyboardType="numeric" placeholder="0"/></View>
            </Row>
            <Input label={t('decide.store')} value={pwStore} onChangeText={setPwStore} placeholder="e.g. Amazon, Fnac..."/>
            <Button label={t('decide.addWatchlist')} onPress={addPriceWatch}/>
          </Card>
          <SectionTitle>{t('decide.watchlistTitle')}</SectionTitle>
          {!priceWatchlist.length && ( <Empty icon="📈" message={t('decide.noItems')}/> )}
          {priceWatchlist.map(p => (
            <Card key={p.id}>
              <Row style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '500', fontSize: 14, color: colors.text }}>{p.product}</Text>
                  <Text style={{ fontSize: 11, color: colors.muted }}>{p.store} · Target: {fmt(p.targetPrice)}</Text>
                </View>
                <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>{fmt(p.currentPrice)}</Text>
              </Row>
              <View style={{ backgroundColor: 'rgba(124,106,247,0.07)', borderWidth: 1, borderColor: 'rgba(124,106,247,0.22)', borderRadius: 8, padding: 10 }}>
                <Text style={{ fontSize: 12, color: colors.muted }}>{p.tip}</Text>
              </View>
              <Button label={t('common.delete')} variant="danger" size="sm" style={{ marginTop: 10, alignSelf: 'flex-start' }}
                onPress={() => dispatch({ type: 'DELETE_PRICE_WATCH', payload: p.id })}/>
            </Card>
          ))}
        </>
      )}

      {result && (
        <View style={[s.resultCard, { borderColor: resultColors[result.type]+'44', backgroundColor: resultColors[result.type]+'11' }]}>
          <Text style={[s.resultTitle, { color: resultColors[result.type] }]}>{result.v}</Text>
          <Text style={s.resultMsg}>{result.msg}</Text>
        </View>
      )}
        </ScrollView>
  </SafeAreaView>
);
}

const s = StyleSheet.create({
  container:        { flex: 1, backgroundColor: colors.bg },
  scroll: {
  padding: spacing.xl,
  paddingTop: spacing.xl + 8,
  paddingBottom: 40,
},
  title:            { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 4 },
  sub:              { fontSize: 13, color: colors.muted, marginBottom: 20, lineHeight: 20 },
  tabs:             { flexDirection: 'row', backgroundColor: colors.surface2, borderRadius: 10, padding: 3, marginBottom: 16, gap: 2 },
  tab:              { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  tabActive:        { backgroundColor: colors.surface },
  tabText:          { fontSize: 12, color: colors.muted },
  tabTextActive:    { color: colors.text, fontWeight: '500' },
  label:            { fontSize: 12, color: colors.muted, marginBottom: 8 },
  urgencyBtn:       { flex: 1, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.border, alignItems: 'center', backgroundColor: colors.surface2 },
  urgencyBtnActive: { borderColor: colors.accent, backgroundColor: colors.accent+'22' },
  urgencyText:      { fontSize: 12, color: colors.muted },
  urgencyTextActive:{ color: colors.accent, fontWeight: '500' },
  resultCard:       { borderRadius: radius.md, padding: 18, marginTop: 14, borderWidth: 1 },
  resultTitle:      { fontSize: 18, fontWeight: '700', marginBottom: 6 },
  resultMsg:        { fontSize: 13, color: colors.muted, lineHeight: 20 },
});
