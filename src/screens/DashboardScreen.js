import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Modal } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { useAppState, useComputed, uid, today } from '../state';
import { Card, SectionTitle, Button, Input, Empty, Row } from '../components/UI';
import { colors, spacing, radius } from '../theme';

function ScoreRing({ score }) {
  const size = 88, r = 34, circ = 2 * Math.PI * r;
  const dash = circ - (score / 100) * circ;
  const color = score >= 70 ? colors.success : score >= 40 ? colors.warning : colors.danger;
  const label = score >= 70 ? 'Healthy' : score >= 40 ? 'Caution' : 'At Risk';
  return (
    <View style={{ width: size, height: size, position: 'relative', alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
        <Circle cx={44} cy={44} r={r} fill="none" stroke={colors.surface2} strokeWidth={8}/>
        <Circle cx={44} cy={44} r={r} fill="none" stroke={color} strokeWidth={8}
          strokeDasharray={circ} strokeDashoffset={dash} strokeLinecap="round"/>
      </Svg>
      <View style={{ position: 'absolute', alignItems: 'center' }}>
        <Text style={{ fontSize: 20, fontWeight: '700', color }}>{score}</Text>
        <Text style={{ fontSize: 9, color: colors.muted }}>{label}</Text>
      </View>
    </View>
  );
}

function AddTxModal({ visible, onClose, budgets, dispatch }) {
  const [desc, setDesc] = useState('');
  const [amount, setAmount] = useState('');
  const [type, setType] = useState('expense');
  const [catId, setCatId] = useState('');

  const submit = () => {
    if (!desc.trim() || !amount) return Alert.alert('Fill in description and amount.');
    dispatch({ type: 'ADD_TRANSACTION', payload: { id: uid(), desc: desc.trim(), amount: parseFloat(amount), date: today(), type, categoryId: catId || null } });
    setDesc(''); setAmount(''); onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.sheet}>
          <View style={s.handle}/>
          <Text style={s.sheetTitle}>Log transaction</Text>
          <Input label="Description" value={desc} onChangeText={setDesc} placeholder="e.g. Grocery run"/>
          <Input label="Amount" value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="0"/>
          <Text style={s.label}>Type</Text>
          <Row style={{ gap: 10, marginBottom: 12 }}>
            {['expense','income'].map(t => (
              <TouchableOpacity key={t} style={[s.typeBtn, type===t && s.typeBtnActive]} onPress={() => setType(t)}>
                <Text style={[s.typeBtnText, type===t && s.typeBtnTextActive]}>{t.charAt(0).toUpperCase()+t.slice(1)}</Text>
              </TouchableOpacity>
            ))}
          </Row>
          {budgets.length > 0 && (
            <>
              <Text style={s.label}>Category</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
                <Row style={{ gap: 8 }}>
                  {budgets.map(b => (
                    <TouchableOpacity key={b.id} style={[s.catChip, catId===b.id && { borderColor: b.color, backgroundColor: b.color + '22' }]} onPress={() => setCatId(catId===b.id?'':b.id)}>
                      <Text style={{ fontSize: 14 }}>{b.icon}</Text>
                      <Text style={[s.catChipText, catId===b.id && { color: colors.text }]}>{b.name}</Text>
                    </TouchableOpacity>
                  ))}
                </Row>
              </ScrollView>
            </>
          )}
          <Row style={{ gap: 10 }}>
            <Button label="Cancel" variant="secondary" style={{ flex: 1 }} onPress={onClose}/>
            <Button label="Log it" style={{ flex: 1 }} onPress={submit}/>
          </Row>
        </View>
      </View>
    </Modal>
  );
}

export default function DashboardScreen({ navigation }) {
  const { state, dispatch } = useAppState();
  const { totalSpent, availableBalance, savingsAmount, healthScore, fmt } = useComputed();
  const [showAddTx, setShowAddTx] = useState(false);
  const { profile, budgets, transactions, savingsGoals, streak } = state;
  const recent = [...transactions].sort((a,b) => b.date.localeCompare(a.date)).slice(0,4);
  const ac = availableBalance < 0 ? colors.danger : availableBalance < profile.monthlyIncome * 0.1 ? colors.warning : colors.success;

  return (
    <ScrollView style={s.container} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
      <View style={s.headerRow}>
        <View>
          <Text style={s.greeting}>Good day,</Text>
          <Text style={s.name}>{profile.name} 👋</Text>
        </View>
        <ScoreRing score={healthScore}/>
      </View>

      {streak.current >= 2 && (
        <View style={s.streakBanner}>
          <Text style={{ fontSize: 32 }}>🔥</Text>
          <View>
            <Text style={s.streakLabel}>Spending streak</Text>
            <Text style={s.streakNum}>{streak.current} <Text style={s.streakUnit}>days under budget</Text></Text>
          </View>
        </View>
      )}

      <View style={s.balanceCard}>
        <Text style={s.balanceLabel}>Available this month</Text>
        <Text style={[s.balanceNum, { color: ac }]}>
          {fmt(Math.abs(availableBalance))}{availableBalance < 0 ? ' overbudget' : ''}
        </Text>
        <Row style={{ gap: 24, marginTop: 12 }}>
          {[['Income', fmt(profile.monthlyIncome), colors.text],['Spent', fmt(totalSpent), colors.danger],['Savings', fmt(savingsAmount), colors.success]].map(([l,v,c]) => (
            <View key={l}>
              <Text style={s.balanceMeta}>{l}</Text>
              <Text style={[s.balanceMetaVal, { color: c }]}>{v}</Text>
            </View>
          ))}
        </Row>
      </View>

      {savingsGoals.filter(g=>!g.completed).length > 0 && (
        <>
          <SectionTitle>Savings goals</SectionTitle>
          {savingsGoals.filter(g=>!g.completed).slice(0,2).map(g => {
            const p = Math.min(100, Math.round((g.saved/g.target)*100));
            return (
              <Card key={g.id} style={{ paddingBottom: 12 }}>
                <Row style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ fontSize: 13, color: colors.text }}>{g.icon} {g.name}</Text>
                  <Text style={{ fontSize: 12, color: colors.muted }}>{fmt(g.saved)} / {fmt(g.target)}</Text>
                </Row>
                <View style={{ backgroundColor: colors.surface2, borderRadius: 100, height: 7, overflow: 'hidden' }}>
                  <View style={{ width: `${p}%`, height: '100%', backgroundColor: colors.accent, borderRadius: 100 }}/>
                </View>
              </Card>
            );
          })}
        </>
      )}

      <SectionTitle>Budget overview</SectionTitle>
      <Card style={{ paddingVertical: 4 }}>
        {!budgets.length && <Empty icon="◎" message="No categories yet.\nGo to Budget to create one."/>}
        {budgets.slice(0,4).map(b => {
          const p = Math.min(100, Math.round((b.spent/b.allocated)*100));
          return (
            <View key={b.id} style={s.listItem}>
              <Row style={{ gap: 11, flex: 1 }}>
                <View style={[s.iconBox, { backgroundColor: b.color + '22' }]}>
                  <Text style={{ fontSize: 17 }}>{b.icon}</Text>
                </View>
                <View>
                  <Text style={s.itemName}>{b.name}</Text>
                  <Text style={s.itemSub}>{fmt(b.spent)} / {fmt(b.allocated)}</Text>
                </View>
              </Row>
              <View style={[s.badge, { backgroundColor: p>=90?'rgba(245,101,101,0.15)':p>=70?'rgba(237,137,54,0.15)':'rgba(72,187,120,0.15)' }]}>
                <Text style={{ fontSize: 11, fontWeight: '500', color: p>=90?colors.danger:p>=70?colors.warning:colors.success }}>{p}%</Text>
              </View>
            </View>
          );
        })}
      </Card>

      {recent.length > 0 && (
        <>
          <SectionTitle>Recent transactions</SectionTitle>
          <Card style={{ paddingVertical: 4 }}>
            {recent.map(t => {
              const cat = budgets.find(b => b.id === t.categoryId);
              return (
                <View key={t.id} style={s.listItem}>
                  <Row style={{ gap: 11, flex: 1 }}>
                    <View style={[s.iconBox, { backgroundColor: (cat?.color||'#7c6af7') + '22' }]}>
                      <Text style={{ fontSize: 17 }}>{cat?.icon||'💳'}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.itemName} numberOfLines={1}>{t.desc}{t.recurring ? ' ↻' : ''}</Text>
                      <Text style={s.itemSub}>{cat?.name||'Uncategorized'} · {t.date}</Text>
                    </View>
                  </Row>
                  <Text style={{ fontWeight: '500', color: t.type==='income'?colors.success:colors.danger, fontSize: 13 }}>
                    {t.type==='income'?'+':'−'}{fmt(t.amount)}
                  </Text>
                </View>
              );
            })}
          </Card>
        </>
      )}

      <Button label="+ Log a transaction" variant="secondary" onPress={() => setShowAddTx(true)} style={{ marginTop: 4 }}/>
      <AddTxModal visible={showAddTx} onClose={() => setShowAddTx(false)} budgets={budgets} dispatch={dispatch}/>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:       { flex: 1, backgroundColor: colors.bg },
  scroll:          { padding: spacing.xl, paddingBottom: 40 },
  headerRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  greeting:        { fontSize: 12, color: colors.muted },
  name:            { fontSize: 20, fontWeight: '700', color: colors.text },
  streakBanner:    { backgroundColor: 'rgba(124,106,247,0.12)', borderWidth: 1, borderColor: 'rgba(124,106,247,0.25)', borderRadius: radius.md, padding: 16, marginBottom: 14, flexDirection: 'row', alignItems: 'center', gap: 14 },
  streakLabel:     { fontSize: 12, color: colors.muted },
  streakNum:       { fontSize: 22, fontWeight: '800', color: colors.accent },
  streakUnit:      { fontSize: 14, fontWeight: '400', color: colors.muted },
  balanceCard:     { backgroundColor: '#1e1a3a', borderWidth: 1, borderColor: '#3a3560', borderRadius: radius.md, padding: 18, marginBottom: 14 },
  balanceLabel:    { fontSize: 11, color: colors.muted, marginBottom: 4 },
  balanceNum:      { fontSize: 32, fontWeight: '700', letterSpacing: -1 },
  balanceMeta:     { fontSize: 10, color: colors.muted },
  balanceMetaVal:  { fontSize: 13, fontWeight: '500', marginTop: 2 },
  listItem:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: colors.border },
  iconBox:         { width: 36, height: 36, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  itemName:        { fontSize: 13, fontWeight: '500', color: colors.text },
  itemSub:         { fontSize: 11, color: colors.muted, marginTop: 1 },
  badge:           { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20 },
  overlay:         { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet:           { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  handle:          { width: 36, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetTitle:      { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 16 },
  label:           { fontSize: 12, color: colors.muted, marginBottom: 8, marginTop: 4 },
  typeBtn:         { flex: 1, paddingVertical: 10, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, alignItems: 'center', backgroundColor: colors.surface2 },
  typeBtnActive:   { borderColor: colors.accent, backgroundColor: colors.accent + '22' },
  typeBtnText:     { fontSize: 14, color: colors.muted },
  typeBtnTextActive: { color: colors.accent, fontWeight: '500' },
  catChip:         { paddingHorizontal: 12, paddingVertical: 8, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface2, flexDirection: 'row', alignItems: 'center', gap: 6 },
  catChipText:     { fontSize: 12, color: colors.muted },
});
