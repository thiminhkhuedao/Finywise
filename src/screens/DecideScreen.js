import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { useAppState, useComputed, uid } from '../state';
import { Card, SectionTitle, Button, Input, Row, Empty } from '../components/UI';
import { colors, spacing, radius } from '../theme';

export default function DecideScreen() {
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
    if (!actName.trim()) return Alert.alert('Enter an activity name.');
    const cat = budgets.find(b => b.id === actCatId);
    const catRem = cat ? cat.allocated - cat.spent : Infinity;
    let v, type, msg;
    if (cost === 0) { v="It's free!"; type='yes'; msg="This costs nothing — go enjoy yourself!"; }
    else if (availableBalance <= 0) { v='Not recommended'; type='no'; msg=`You're already over budget by ${fmt(Math.abs(availableBalance))}.`; }
    else if (cost > availableBalance) { v='Cannot afford this'; type='no'; msg=`This costs ${fmt(cost)} but you only have ${fmt(availableBalance)} left.`; }
    else if (cat && cost > catRem) { v='Category over limit'; type='maybe'; msg=`Only ${fmt(catRem)} left in ${cat.name}.`; }
    else if (cost / income > 0.15) { v='Think twice'; type='maybe'; msg=`${fmt(cost)} is over 15% of your income.`; }
    else { v='Go for it! ✓'; type='yes'; msg=`You can comfortably afford this. You'll still have ${fmt(availableBalance - cost)} left!`; }
    setResult({ v, type, msg });
  };

  const analyzePurchase = () => {
    const price = parseFloat(purPrice) || 0;
    if (!purName.trim()) return Alert.alert('Enter a product name.');
    let v, type, msg;
    if (price > availableBalance && urgency !== 'urgent') {
      const mo = Math.ceil(price / Math.max(1, savingsAmount));
      v='Wait — save up first'; type='no'; msg=`Can't comfortably buy this now. Could afford in ~${mo} month${mo>1?'s':''}.`;
    } else if (price > availableBalance) {
      v='Tight — but possible'; type='maybe'; msg=`Urgent but short by ${fmt(price - availableBalance)}.`;
    } else if (price / income > 0.3 && urgency === 'flexible') {
      v='Consider waiting'; type='maybe'; msg=`${fmt(price)} is ${Math.round(price/income*100)}% of income. Watching for a better price is smart.`;
    } else {
      v='Good to go ✓'; type='yes'; msg=`You can afford ${purName}. You'll have ${fmt(availableBalance - price)} remaining.`;
    }
    setResult({ v, type, msg });
  };

  const addPriceWatch = () => {
    const cur = parseFloat(pwCur) || 0, tgt = parseFloat(pwTgt) || 0;
    if (!pwProd.trim()) return Alert.alert('Enter a product name.');
    const diff = cur - tgt, pct = tgt > 0 ? Math.round((diff/cur)*100) : 0;
    const canNow = cur <= availableBalance, canTgt = tgt <= availableBalance;
    let tip;
    if (canNow && cur <= tgt) tip = '✓ You can already afford this!';
    else if (!canNow && !canTgt) tip = `Even at target of ${fmt(tgt)}, you can't afford it yet.`;
    else if (diff > 0) tip = `Waiting for ${pct}% drop (${fmt(diff)} savings). ${canTgt?'Can afford at target.':'Keep saving.'}`;
    else tip = `Price at/below target. ${canNow?'Buy now!':'Almost there.'}`;
    dispatch({ type: 'ADD_PRICE_WATCH', payload: { id: uid(), product: pwProd, currentPrice: cur, targetPrice: tgt, store: pwStore||'Any', tip } });
    setPwProd(''); setPwCur(''); setPwTgt(''); setPwStore('');
    Alert.alert('Added to watchlist!');
  };

  const resultColors = { yes: colors.success, no: colors.danger, maybe: colors.warning };

  return (
    <ScrollView style={s.container} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
      <Text style={s.title}>Smart Advisor</Text>
      <Text style={s.sub}>Ask FinyWise whether you can afford something — right now.</Text>

      <View style={s.tabs}>
        {[['activity','🎯 Activity'],['purchase','🛒 Purchase'],['price','📈 Watchlist']].map(([t,l]) => (
          <TouchableOpacity key={t} style={[s.tab, tab===t&&s.tabActive]} onPress={() => { setTab(t); setResult(null); }}>
            <Text style={[s.tabText, tab===t&&s.tabTextActive]}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {tab === 'activity' && (
        <Card>
          <Input label="What's the activity?" value={actName} onChangeText={setActName} placeholder="e.g. Dinner with friends"/>
          <Input label="Estimated cost" value={actCost} onChangeText={setActCost} keyboardType="numeric" placeholder="0"/>
          <Button label="Analyze ✦" onPress={analyzeActivity}/>
        </Card>
      )}

      {tab === 'purchase' && (
        <Card>
          <Input label="What do you want to buy?" value={purName} onChangeText={setPurName} placeholder="e.g. Laptop..."/>
          <Input label="Price" value={purPrice} onChangeText={setPurPrice} keyboardType="numeric" placeholder="0"/>
          <Text style={s.label}>Can it wait?</Text>
          <Row style={{ gap: 8, marginBottom: 16 }}>
            {[['flexible','Flexible'],['soon','Soon'],['urgent','Urgent']].map(([u,l]) => (
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
            <Input label="Product name" value={pwProd} onChangeText={setPwProd} placeholder="e.g. MacBook Air M3"/>
            <Row style={{ gap: 10 }}>
              <View style={{ flex: 1 }}><Input label="Current price" value={pwCur} onChangeText={setPwCur} keyboardType="numeric" placeholder="0"/></View>
              <View style={{ flex: 1 }}><Input label="Target price" value={pwTgt} onChangeText={setPwTgt} keyboardType="numeric" placeholder="0"/></View>
            </Row>
            <Input label="Store" value={pwStore} onChangeText={setPwStore} placeholder="e.g. Amazon, Fnac..."/>
            <Button label="Add to watchlist ✦" onPress={addPriceWatch}/>
          </Card>
          <SectionTitle>Price watchlist</SectionTitle>
          {!priceWatchlist.length && <Empty icon="📈" message="No items yet.\nAdd a product above."/>}
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
              <Button label="Remove" variant="danger" size="sm" style={{ marginTop: 10, alignSelf: 'flex-start' }}
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
  );
}

const s = StyleSheet.create({
  container:        { flex: 1, backgroundColor: colors.bg },
  scroll:           { padding: spacing.xl, paddingBottom: 40 },
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
