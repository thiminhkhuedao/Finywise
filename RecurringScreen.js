import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppState, useComputed } from '../state';
import { Card, SectionTitle, Button, Empty, TipBox, Row } from '../components/UI';
import { colors, spacing, radius } from '../theme';
import { useTranslation } from 'react-i18next';


function RecurringModal({ visible, onClose, onSave, budgets }) {
  const [name, setName] = useState('');
  const { t } = useTranslation();
  const [icon, setIcon] = useState('↻');
  const [amount, setAmount] = useState('');
  const [freq, setFreq] = useState('monthly'); 
  const [catId, setCatId] = useState('');
  const TextInput = require('react-native').TextInput;

  const submit = () => {
    if (!name || !amount) return Alert.alert(t('recurring.fillFields'));
    onSave({ name, icon, amount: parseFloat(amount), frequency: freq, categoryId: catId || null });
    setName(''); setIcon('↻'); setAmount(''); onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.sheet}>
          <View style={s.handle}/>
          <Text style={s.sheetTitle}>{t('recurring.addExpense')}</Text>
          <Text style={s.label}>{t('common.name')}</Text>
          <TextInput style={s.input} value={name} onChangeText={setName} placeholder={t('recurring.namePlaceholder')} placeholderTextColor={colors.muted}/>
          <Row>
            <View style={{flex:1,marginRight:8}}>
              <Text style={s.label}>{t('budget.icon')}</Text>
              <TextInput style={s.input} value={icon} onChangeText={setIcon} maxLength={2} placeholderTextColor={colors.muted}/>
            </View>
            <View style={{flex:2}}>
              <Text style={s.label}>{t('split.amount')}</Text>
              <TextInput style={s.input} value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder={t('number')} placeholderTextColor={colors.muted}/>
            </View>
          </Row>
          <Row style={{gap:8,marginBottom:16}}>
            {['monthly', 'weekly', 'yearly'].map(f => (
              <TouchableOpacity 
              key={f} onPress={()=>setFreq(f)}
                style={[s.chip, freq===f && s.chipActive]}>
                <Text style={[s.chipText, freq===f && s.chipTextActive]}>{t(`recurring.${f}`)}</Text>
              </TouchableOpacity>
            ))}
          </Row>
          <Row style={{gap:8}}>
            <Button label={t('common.cancel')} variant="secondary" style={{flex:1}} onPress={onClose}/>
            <Button label={t('common.add')} variant="primary" style={{flex:1}} onPress={submit}/>
          </Row>
        </View>
      </View>
    </Modal>
  );
}

export default function RecurringScreen({ navigation }) {
  const { state, dispatch } = useAppState();
  const { t } = useTranslation();
  const { fmt } = useComputed();
  const [showAdd, setShowAdd] = useState(false);
  const month = new Date().toISOString().slice(0,7);

  const handleAdd = (data) => {
    dispatch({ type: 'ADD_RECURRING', payload: { ...data, id: Date.now().toString(36), lastApplied: null } });
  };

  const handleDelete = (id) => {
    Alert.alert(t('recurring.remove'), t('recurring.removeMessage'),[
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => dispatch({ type: 'DELETE_RECURRING', payload: id }) }
    ]);
  };

  return (
  <SafeAreaView style={s.container} edges={['top']}>
    <ScrollView
      contentContainerStyle={s.scroll}
      showsVerticalScrollIndicator={false}
    >
      <Text style={s.title}> {t('recurring.title')}</Text>
      <Text style={s.sub}>{t('recurring.subtitle')}</Text>

      <Button label={t('recurring.addButton')} variant="primary" onPress={() => setShowAdd(true)} style={{marginBottom:20}}/>

      {!state.recurringExpenses?.length && (
        <Empty icon="↻" message={t('recurring.empty')}/>
      )}

      {(state.recurringExpenses || []).map(r => {
        const cat = state.budgets.find(b => b.id === r.categoryId);
        const applied = r.lastApplied === month;
        return (
          <Card key={r.id} style={{marginBottom:10}}>
            <View style={s.recurRow}>
              <View style={[s.iconBox, {backgroundColor: (cat?.color||colors.accent)+'22'}]}>
                <Text style={{fontSize:18}}>{r.icon||'↻'}</Text>
              </View>
              <View style={{flex:1}}>
                <Text style={s.recurName}>{r.name}</Text>
                <Text style={s.recurSub}>{cat?.key ? t(`budget.${cat.key}`)  : t('budget.uncategorized')}  {' · '}{r.frequency}</Text>
              </View>
              <View style={{alignItems:'flex-end'}}>
                <Text style={[s.recurAmt, {color:colors.danger}]}>{fmt(r.amount)}</Text>
                <Text style={[s.recurStatus, {color: applied ? colors.success : colors.muted}]}>
                 {applied ? t('recurring.applied') : t('recurring.pending')} 
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => handleDelete(r.id)} style={s.removeBtn}>
              <Text style={s.removeBtnText}>✕ {t('common.delete')}</Text>
            </TouchableOpacity>
          </Card>
        );
      })}

      <TipBox>{t('recurring.tip')}</TipBox>

      <RecurringModal visible={showAdd} onClose={() => setShowAdd(false)} onSave={handleAdd} budgets={state.budgets}/>
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
  title: { fontSize:22, fontWeight:'700', color:colors.text, marginBottom:4 },
  sub: { fontSize:13, color:colors.muted, marginBottom:20, lineHeight:20 },
  recurRow: { flexDirection:'row', alignItems:'center', gap:12, marginBottom:10 },
  iconBox: { width:40, height:40, borderRadius:10, alignItems:'center', justifyContent:'center' },
  recurName: { fontSize:14, fontWeight:'500', color:colors.text },
  recurSub: { fontSize:11, color:colors.muted, marginTop:2 },
  recurAmt: { fontSize:15, fontWeight:'700' },
  recurStatus: { fontSize:10, marginTop:2 },
  removeBtn: { alignSelf:'flex-start', paddingVertical:4 },
  removeBtnText: { fontSize:12, color:colors.danger },
  overlay: { flex:1, justifyContent:'flex-end', backgroundColor:'rgba(0,0,0,0.6)' },
  sheet: { backgroundColor:colors.surface, borderTopLeftRadius:20, borderTopRightRadius:20, padding:24, paddingBottom:40 },
  handle: { width:36, height:4, backgroundColor:colors.border, borderRadius:2, alignSelf:'center', marginBottom:16 },
  sheetTitle: { fontSize:17, fontWeight:'700', color:colors.text, marginBottom:16, fontFamily:'System' },
  label: { fontSize:12, color:colors.muted, marginBottom:4 },
  input: { backgroundColor:colors.surface2, borderWidth:1, borderColor:colors.border, borderRadius:10, color:colors.text, fontSize:14, padding:10, marginBottom:12 },
  chip: { paddingHorizontal:14, paddingVertical:8, borderRadius:100, borderWidth:1, borderColor:colors.border, backgroundColor:'transparent' },
  chipActive: { backgroundColor:colors.accent, borderColor:colors.accent },
  chipText: { fontSize:12, color:colors.muted },
  chipTextActive: { color:'#fff', fontWeight:'500' },
});
