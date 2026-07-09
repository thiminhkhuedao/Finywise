import { SafeAreaView } from 'react-native-safe-area-context';
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Modal } from 'react-native';
import { useAppState, useComputed, uid } from '../state';
import { Card, SectionTitle, Button, Input, Row, Empty } from '../components/UI';
import { colors, spacing, radius } from '../theme';
import { useTranslation } from 'react-i18next';

const COLORS = ['#7c6af7','#4fd1c5','#ed8936','#48bb78','#f56565','#63b3ed','#fc8181','#68d391'];

function AddCatModal({ visible, onClose, dispatch, state }) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📦');
  const [amount, setAmount] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [editingBudget, setEditingBudget] = useState(null);
  const submit = () => {
    if (!name.trim()) return Alert.alert(t('budget.enter_name'));
    const futureAllocated =
  state.budgets.reduce((sum, b) => sum + b.allocated, 0)
  + (parseFloat(amount) || 0);

  if (futureAllocated > state.profile.monthlyIncome) {
  Alert.alert(
    t("budget.warning"),
    t("budget.overallocated")
  );
}
    dispatch({ type: 'ADD_BUDGET', payload: { id: uid(), name: name.trim(), icon, allocated: parseFloat(amount)||0, spent: 0, color } });
    setName(''); setIcon('📦'); setAmount(''); onClose();

    Alert.alert(
  t("budget.warning"),
  t("budget.reviewBudgets")
);

  };
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.overlay}><View style={s.sheet}>
        <View style={s.handle}/>
        <Text style={s.sheetTitle}>{t('budget.new_category')}</Text>
        <Input label={t('common.name')} value={name} onChangeText={setName} placeholder={t('budget.namePlaceholder')}/>
        <Row style={{ gap: 10 }}>
          <View style={{ flex: 1 }}><Input label={t('budget.icon')} value={icon} onChangeText={setIcon} maxLength={2}/></View>
          <View style={{ flex: 2 }}><Input label={t('budget.monthly_budget')} value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="0"/></View>
        </Row>
        <Text style={s.label}>{t('budget.color')}</Text>
        <View style={s.colorRow}>
          {COLORS.map(c => (
            <TouchableOpacity key={c} onPress={() => setColor(c)}
              style={[s.colorChip, { backgroundColor: c }, color===c && s.colorChipActive]}/>
          ))}
        </View>
        <Row style={{ gap: 10 }}>
          <Button label={t('common.cancel')} variant="secondary" style={{ flex: 1 }} onPress={onClose}/>
          <Button label={t('common.add')} style={{ flex: 1 }} onPress={submit}/>
        </Row>
      </View></View>
    </Modal>
  );
}

function EditCatModal({ visible, onClose, dispatch }) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('📦');
  const [amount, setAmount] = useState('');
  const [color, setColor] = useState(COLORS[0]);
  const [editingBudget, setEditingBudget] = useState(null);
  const submit = () => {
    if (!name.trim()) return Alert.alert('Enter a name.');
    dispatch({ type: 'UPDATE_BUDGET', payload: { id: uid(), name: name.trim(), icon, allocated: parseFloat(amount)||0, spent: 0, color } });
    setName(''); setIcon('📦'); setAmount(''); onClose();
  };

  Alert.alert(
  t("budget.warning"),
  t("budget.reviewBudgets")
);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.overlay}><View style={s.sheet}>
        <View style={s.handle}/>
        <Text style={s.sheetTitle}>New budget category</Text>
        <Input label={t('budget.name')} value={name} onChangeText={setName} placeholder={t('budget.example')}/>
        <Row style={{ gap: 10 }}>
          <View style={{ flex: 1 }}><Input label={t('budget.icon')} value={icon} onChangeText={setIcon} maxLength={2}/></View>
          <View style={{ flex: 2 }}><Input label={t('budget.monthly_budget')} value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="0"/></View>
        </Row>
        <Text style={s.label}>{t('budget.color')}</Text>
        <View style={s.colorRow}>
          {COLORS.map(c => (
            <TouchableOpacity key={c} onPress={() => setColor(c)}
              style={[s.colorChip, { backgroundColor: c }, color===c && s.colorChipActive]}/>
          ))}
        </View>
        <Row style={{ gap: 10 }}>
          <Button label={t('common.cancel')} variant="secondary" style={{ flex: 1 }} onPress={onClose}/>
          <Button label={t('common.add')} style={{ flex: 1 }} onPress={submit}/>
        </Row>
      </View></View>
    </Modal>
  );
}

export default function BudgetScreen({ navigation }) {
  const { t } = useTranslation();
  const { state, dispatch } = useAppState();
  const { fmt } = useComputed();
  const [showAdd, setShowAdd] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const { budgets, transactions } = state;
  const totalAllocated = budgets.reduce((s,b)=>s+b.allocated,0);
  const income = state.profile.monthlyIncome || 0;

  const deleteCat = (id) => {

    const budget = budgets.find(b => b.id === id);

    if (budget?.spent > 0) {
        Alert.alert(
            t("budget.delete_category"),
            t("budget.deleteWarning"),
            [
                {
                    text: t("common.cancel"),
                    style: "cancel"
                },
                {
                    text: t("common.delete"),
                    style: "destructive",
                    onPress: () =>
                        dispatch({
                            type: "DELETE_BUDGET",
                            payload: id
                        })
                }
            ]
        );

        return;
    }

    Alert.alert(
        t("budget.delete_category"),
        "",
        [
            {
                text: t("common.cancel"),
                style: "cancel"
            },
            {
                text: t("common.delete"),
                style: "destructive",
                onPress: () =>
                    dispatch({
                        type: "DELETE_BUDGET",
                        payload: id
                    })
            }
        ]
    );
};

  const allTx = [...transactions].sort((a,b) => b.date.localeCompare(a.date));

  return (
  <SafeAreaView style={s.container} edges={['top']}>
    <ScrollView
      contentContainerStyle={s.scroll}
      showsVerticalScrollIndicator={false}>
      <Row style={{ justifyContent: 'space-between', marginBottom: 16 }}>
       <Text style={s.title}>{t('budget.title')}</Text> 
        <Button label={`+ ${t('common.add')}`} size="sm" onPress={() => setShowAdd(true)}/>
      </Row>

      <Card
        style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap', paddingVertical: 14, }}>
        {[[t('budget.income'), fmt(income), colors.text], [t('budget.budgeted'), fmt(totalAllocated), colors.accent], [t('budget.free'), fmt(income - totalAllocated), income - totalAllocated >= 0  ? colors.success : colors.danger,], ].map(([l, v, c]) => (
        <View  key={l} style={{ flex: 1, minWidth: 70 }}>
          <Text style={{fontSize: 10, color: colors.muted,}}>{l}</Text>
          <Text style={{ fontSize: 17, fontWeight: '700',color: c,}}>{v}</Text>
        </View>
       ))}
      </Card>

      <SectionTitle>{t('budget.categories')}</SectionTitle>
      {!budgets.length && <Empty icon="◎" message={t('budget.no_categories')}/>}
      {budgets.map(b => {
        const p = !b.allocated ? 0 : Math.min(100, Math.round((b.spent/b.allocated)*100));
        const barColor = p>=90?colors.danger:p>=70?colors.warning:colors.accent2;
        return (
          <TouchableOpacity key={b.id} activeOpacity={0.8} onPress={() => setEditingBudget(b)}>
          <Card style={{ marginBottom: 10 }}>
            <Row style={{ justifyContent: 'space-between', marginBottom: 10 }}>
              <Row style={{ gap: 10, flex: 1 }}>
                <View style={{ width: 36, height: 36, borderRadius: 9, backgroundColor: b.color+'22', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 17 }}>{b.icon}</Text>
                </View>
                <View>
                  <Text style={{ fontWeight: '500', fontSize: 13, color: colors.text }}>{b.key ? t(`budget.${b.key}`) : b.name}</Text>
                  <Text style={{ fontSize: 11, color: colors.muted }}>{fmt(b.spent)} of {fmt(b.allocated)}</Text>
                </View>
              </Row>
              <Button label="✕" variant="danger" size="sm" onPress={() => deleteCat(b.id)}/>
            </Row>
            <View style={{ backgroundColor: colors.surface2, borderRadius: 100, height: 7, overflow: 'hidden' }}>
              <View style={{ width: `${p}%`, height: '100%', backgroundColor: barColor, borderRadius: 100 }}/>
            </View>
            <Text style={{ fontSize: 10, color: colors.muted, marginTop: 4, textAlign: 'right' }}>{p}%{p>=90?' — almost full!':''}</Text>
          </Card>
</TouchableOpacity>
        );
      })}

      <SectionTitle>{t('budget.all_transactions')}</SectionTitle>
      {!allTx.length && <Empty icon="💳" message={t('budget.no_transactions')}/>}
      {allTx.map(tx => {
        const cat = budgets.find(b => String(b.id) === String(tx.categoryId));
        const label = cat?.key ? t(`budget.${cat.key}`) : cat?.name || t('budget.uncategorized'); 
        console.log("cat =", cat);
        console.log("cat.key =", cat?.key);
        console.log("cat.name =", cat?.name);
        return (
          <View key={tx.id} style={s.txRow}>
            <Row style={{ gap: 11, flex: 1 }}>
              <View style={{ width: 36, height: 36, borderRadius: 9, backgroundColor: (cat?.color || '#888') + '22', alignItems: 'center', justifyContent: 'center',}}>
                <Text style={{ fontSize: 17 }}>{cat?.icon || '💳'}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 13, color: colors.text }} numberOfLines={1}>{tx.desc}{tx.recurring ? ' ↻' : ''}</Text>
                <Text style={{ fontSize: 11, color: colors.muted }}>{label}{' · '}{tx.date} </Text>
              </View>
            </Row>
            <Text style={{ fontWeight: '500', color: tx.type === 'income' ? colors.success : colors.danger,fontSize: 13,}}>
              {tx.type === 'income' ? '+' : '−'}{fmt(tx.amount)}
            </Text>
          </View>
        );
      })}

            <AddCatModal
  visible={showAdd}
  onClose={() => setShowAdd(false)}
  dispatch={dispatch}
  state={state}
/>
    </ScrollView>
  </SafeAreaView>
);
}

const s = StyleSheet.create({
  container:  { flex: 1, backgroundColor: colors.bg },
  scroll: {
  padding: spacing.xl,
  paddingTop: spacing.xl + 8,
  paddingBottom: 40,
},
  title:      { fontSize: 22, fontWeight: '700', color: colors.text },
  txRow:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 11, borderBottomWidth: 1, borderBottomColor: colors.border },
  overlay:    { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet:      { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  handle:     { width: 36, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 16 },
  label:      { fontSize: 12, color: colors.muted, marginBottom: 8 },
  colorRow:   { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
  colorChip:  { width: 32, height: 32, borderRadius: 8 },
  colorChipActive: { borderWidth: 3, borderColor: '#fff' },
});
