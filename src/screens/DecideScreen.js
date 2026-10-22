import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAppState, useComputed, uid } from '../state';
import { Card, SectionTitle, Button, Input, Row, Empty, Badge } from '../components/UI';
import { usePriceRefresher } from '../priceRefresher';
import { normalizeUrl, hostOf, parsePrice } from '../priceScraper';
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
  const [pwUrl, setPwUrl] = useState('');
  const [pwProd, setPwProd] = useState('');
  const [pwCur, setPwCur] = useState('');
  const [pwTgt, setPwTgt] = useState('');
  const { refresh, refreshing } = usePriceRefresher();

  const income = state.profile.monthlyIncome || 1;

  const analyzeActivity = () => {
    const cost = parseFloat(actCost) || 0;
    if (!actName.trim()) return Alert.alert(t('decide.enterActivity'));
    const cat = budgets.find(b => b.id === actCatId);
    const catRem = cat ? cat.allocated - cat.spent : Infinity;
    let v, type, msg;
    if (cost === 0) { v = t('decide.freeTitle'); type='yes'; msg = t('decide.freeMessage'); }
    else if (availableBalance <= 0) { v = t('decide.notRecommended'); type='no'; msg=  t('decide.overBudget', { amount: fmt(Math.abs(availableBalance))}); }
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
      v = t('decide.wait'); type='no'; msg= t('decide.affordInMonths', {  count: mo, months: mo,});
    } else if (price > availableBalance) {
      v = t('decide.tight'); type='maybe'; msg=t('decide.shortBy', {amount: fmt(price - availableBalance),});
    } else if (price / income > 0.3 && urgency === 'flexible') {
      v = t('decide.considerWaiting'); type='maybe'; msg=t('decide.highIncomePercent', { price: fmt(price),   percent: Math.round((price / income) * 100),  });
    } else {
      v = t('decide.goodToGo'); type='yes'; msg=t('decide.canAffordProduct', { product: purName,  amount: fmt(availableBalance - price), });}
    setResult({ v, type, msg });
  };

  const addPriceWatch = () => {
    const url = pwUrl.trim() ? normalizeUrl(pwUrl) : null;
    if (pwUrl.trim() && !url) return Alert.alert(t('decide.invalidUrl'));
    const cur = parsePrice(pwCur), tgt = parsePrice(pwTgt);
    if (!tgt) return Alert.alert(t('decide.enterTarget'));
    if (!url && !pwProd.trim()) return Alert.alert(t('decide.enterProductOrUrl'));
    if (!url && !cur) return Alert.alert(t('decide.enterCurrent'));
    const item = {
      id: uid(),
      product: pwProd.trim(),
      url,
      store: url ? hostOf(url) : '',
      currentPrice: cur,
      targetPrice: tgt,
      lastChecked: null,
      priceError: false,
    };
    dispatch({ type: 'ADD_PRICE_WATCH', payload: item });
    setPwUrl(''); setPwProd(''); setPwCur(''); setPwTgt('');
    if (url) refresh([item]);
    else Alert.alert(t('decide.addedWatchlist'));
  };

  const watchTip = (cur, tgt) => {
    const diff = cur - tgt, pct = cur > 0 ? Math.round((diff / cur) * 100) : 0;
    const canNow = cur <= availableBalance, canTgt = tgt <= availableBalance;
    if (canNow && cur <= tgt) return t('decide.watch.canNow');
    if (!canNow && !canTgt) return t('decide.watch.cannotTarget', { target: fmt(tgt) });
    if (diff > 0) return t('decide.watch.waitForDrop', { percent: pct, savings: fmt(diff), advice: canTgt ? t('decide.watch.affordTarget') : t('decide.watch.keepSaving') });
    return t('decide.watch.belowTarget', { advice: canNow ? t('decide.watch.buyNow') : t('decide.watch.almostThere') });
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
        {[ ['activity', t('decide.activity')], ['purchase', t('decide.purchase')], ['price', t('decide.watchlist')]].map(([t,l]) => (
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
          <Button label={t('decide.analyze')}  onPress={analyzePurchase}/>
        </Card>
      )}

      {tab === 'price' && (
        <>
          <Card>
            <Input label={t('decide.productUrl')} value={pwUrl} onChangeText={setPwUrl} placeholder="https://www.amazon.fr/..." autoCapitalize="none" autoCorrect={false} keyboardType="url"/>
            <Input label={t('decide.productNameOptional')} value={pwProd} onChangeText={setPwProd} placeholder="MacBook Air M3"/>
            <Row style={{ gap: 10 }}>
              <View style={{ flex: 1 }}><Input label={t('decide.targetPrice')} value={pwTgt} onChangeText={setPwTgt} keyboardType="numeric" placeholder="0"/></View>
              <View style={{ flex: 1 }}><Input label={t('decide.currentPriceOptional')} value={pwCur} onChangeText={setPwCur} keyboardType="numeric" placeholder="0"/></View>
            </Row>
            <Button label={t('decide.addWatchlist')} onPress={addPriceWatch}/>
          </Card>
          <Row style={{ justifyContent: 'space-between', marginBottom: 4 }}>
            <SectionTitle style={{ marginBottom: 0 }}>{t('decide.watchlistTitle')}</SectionTitle>
            {priceWatchlist.some(p => p.url) && (
              <Button size="sm" variant="secondary" disabled={refreshing}
                label={refreshing ? t('decide.refreshing') : t('decide.refresh')}
                onPress={() => refresh()}/>
            )}
          </Row>
          <View style={{ height: 8 }}/>
          {!priceWatchlist.length && ( <Empty message={t('decide.noItems')}/> )}
          {priceWatchlist.map(p => (
            <WatchCard key={p.id} p={p} t={t} fmt={fmt} refreshing={refreshing}
              tip={p.currentPrice != null ? watchTip(p.currentPrice, p.targetPrice) : null}
              onDelete={() => dispatch({ type: 'DELETE_PRICE_WATCH', payload: p.id })}
              onSetPrice={(price) => dispatch({ type: 'UPDATE_PRICE_WATCH', payload: { id: p.id, currentPrice: price, priceError: false, lastChecked: Date.now() } })}/>
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

function WatchCard({ p, t, fmt, tip, refreshing, onDelete, onSetPrice }) {
  const [manual, setManual] = useState('');
  const hasPrice = p.currentPrice != null;
  const reached = hasPrice && p.targetPrice > 0 && p.currentPrice <= p.targetPrice;
  const unreadable = !!p.url && !!p.priceError;
  const checking = !!p.url && refreshing && !hasPrice && !p.priceError;
  const title = p.product || p.store || p.url;

  const saveManual = () => {
    const price = parsePrice(manual);
    if (!price) return;
    onSetPrice(price);
    setManual('');
  };

  return (
    <Card style={reached ? { borderColor: colors.success + '88' } : null}>
      <Row style={{ justifyContent: 'space-between', marginBottom: 8, alignItems: 'flex-start' }}>
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text style={{ fontWeight: '500', fontSize: 14, color: colors.text }} numberOfLines={2}>{title}</Text>
          <Text style={{ fontSize: 11, color: colors.muted, marginTop: 2 }}>
            {p.store ? p.store + ' · ' : ''}{t('decide.target')} : {fmt(p.targetPrice)}
          </Text>
        </View>
        <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text }}>
          {hasPrice ? fmt(p.currentPrice) : '—'}
        </Text>
      </Row>

      {reached ? <Badge variant="success" label={'🎉 ' + t('decide.goalReached')}/>
        : unreadable ? <Badge variant="warning" label={'⚠️ ' + t('decide.unreadable')}/>
        : checking ? <Badge label={t('decide.checking')}/>
        : <Badge label={'⏳ ' + t('decide.waiting')}/>}

      {unreadable && (
        <Text style={{ fontSize: 12, color: colors.muted, marginTop: 8, lineHeight: 18 }}>
          {t('decide.unreadableHint')}
        </Text>
      )}

      {tip && !unreadable && (
        <View style={{ backgroundColor: 'rgba(124,106,247,0.07)', borderWidth: 1, borderColor: 'rgba(124,106,247,0.22)', borderRadius: 8, padding: 10, marginTop: 10 }}>
          <Text style={{ fontSize: 12, color: colors.muted }}>{tip}</Text>
        </View>
      )}

      {(unreadable || !p.url) && (
        <Row style={{ gap: 8, marginTop: 10, alignItems: 'flex-end' }}>
          <View style={{ flex: 1 }}>
            <Input label={t('decide.manualPrice')} value={manual} onChangeText={setManual} keyboardType="numeric" placeholder="0"/>
          </View>
          <Button label={t('decide.updatePrice')} variant="secondary" size="sm" style={{ marginBottom: 12 }} onPress={saveManual}/>
        </Row>
      )}

      {p.lastChecked ? (
        <Text style={{ fontSize: 11, color: colors.muted, marginTop: 8 }}>
          {t('decide.lastChecked', { date: new Date(p.lastChecked).toLocaleString() })}
        </Text>
      ) : null}

      <Row style={{ gap: 8, marginTop: 10 }}>
        {p.url ? <Button label={t('decide.openProduct')} variant={reached ? 'success' : 'secondary'} size="sm" onPress={() => Linking.openURL(p.url)}/> : null}
        <Button label={t('common.delete')} variant="danger" size="sm" onPress={onDelete}/>
      </Row>
    </Card>
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