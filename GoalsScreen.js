import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppState, useComputed } from '../state';
import { Card, SectionTitle, Button, Empty, Row } from '../components/UI';
import { colors, spacing, radius } from '../theme';
import { useTranslation } from 'react-i18next';
import { t } from 'i18next';

const GOAL_ICONS = ['✈️','🏠','💻','🎓','🚗','💍','🏖️','🎮','📱','🎸','👗','🌍'];

function AddGoalModal({ visible, onClose, onSave }) {
  const TextInput = require('react-native').TextInput;
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('✈️');
  const [target, setTarget] = useState('');
  const [saved, setSaved] = useState('');
  const { t } = useTranslation();

  const submit = () => {
    if (!name || !target) return Alert.alert(t('goals.fillFields'));
    const deadline = new Date(Date.now() + 90*24*60*60*1000).toISOString().slice(0,10);
    onSave({ name, icon, target: parseFloat(target), saved: parseFloat(saved)||0, deadline });
    setName(''); setTarget(''); setSaved(''); onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.sheet}>
          <View style={s.handle}/>
          <Text style={s.sheetTitle}>{t('goals.newGoal')}</Text>
          <Text style={s.label}>{t('goals.savingFor')}</Text>
          <TextInput style={s.input} value={name} onChangeText={setName} placeholder={t('goals.placeholder')} placeholderTextColor={colors.muted}/>
          <Text style={s.label}>{t('goals.chooseIcon')}</Text>
          <View style={s.iconGrid}>
            {GOAL_ICONS.map(i => (
              <TouchableOpacity key={i} onPress={() => setIcon(i)}
                style={[s.iconChip, icon===i && s.iconChipActive]}>
                <Text style={{fontSize:20}}>{i}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Row style={{gap:8}}>
            <View style={{flex:1}}>
              <Text style={s.label}>{t('goals.targetAmount')}</Text>
              <TextInput style={s.input} value={target} onChangeText={setTarget} keyboardType="numeric" placeholder="0" placeholderTextColor={colors.muted}/>
            </View>
            <View style={{flex:1}}>
              <Text style={s.label}>{t('goals.alreadySaved')}</Text>
              <TextInput style={s.input} value={saved} onChangeText={setSaved} keyboardType="numeric" placeholder="0" placeholderTextColor={colors.muted}/>
            </View>
          </Row>
          <Row style={{gap:8}}>
            <Button label={t('common.cancel')} variant="secondary" style={{flex:1}} onPress={onClose}/>
            <Button label={t('goals.createGoal')} variant="primary" style={{flex:1}} onPress={submit}/>
          </Row>
        </View>
      </View>
    </Modal>
  );
}

export default function GoalsScreen({ navigation }) {
  const { state, dispatch } = useAppState();
  const { fmt } = useComputed();
  const [showAdd, setShowAdd] = useState(false);
  const { t } = useTranslation();

  const goals = state.savingsGoals || [];
  const active = goals.filter(g => !g.completed);
  const done = goals.filter(g => g.completed);

  const handleAdd = (data) => {
    const g = { ...data, id: Date.now().toString(36), completed: data.saved >= data.target };
    dispatch({ type: 'ADD_GOAL', payload: g });
  };

  const handleAddFunds = (id) => {
    Alert.prompt(t('goals.addFunds'), t('goals.addFundsQuestion'),  (val) => {
      const amt = parseFloat(val);
      if (!amt) return;
      dispatch({ type: 'ADD_TO_GOAL', payload: { id, amount: amt } });
    }, 'plain-text', '', 'numeric');
  };

  const handleDelete = (id) => {
    Alert.alert(t('goals.deleteGoal'), '', [
      { text: t('common.cancel'), style: 'cancel' },
      { text: t('common.delete'), style: 'destructive', onPress: () => dispatch({ type: 'DELETE_GOAL', payload: id }) }
    ]);
  };

  const pct = (a,b) => !b ? 0 : Math.min(100, Math.round((a/b)*100));

  const statusColor = (g) => {
    const p = pct(g.saved, g.target);
    const daysLeft = Math.max(0, Math.ceil((new Date(g.deadline)-new Date())/(1000*60*60*24)));
    if (p >= 100) return colors.success;
    if (daysLeft < 7 && p < 80) return colors.danger;
    return colors.success;
  };

return (
  <SafeAreaView style={s.container} edges={['top']}>
    <ScrollView
      contentContainerStyle={s.scroll}
      showsVerticalScrollIndicator={false}
    >
      <Text style={s.title}>{t('goals.newGoal')}</Text>
      <Text style={s.sub}>{t('goals.description')}</Text>
      <Button label={t('goals.addGoal')} variant="primary" onPress={() => setShowAdd(true)} style={{marginBottom:20}}/>

      {!goals.length && <Empty icon="🎯" message={t('goals.empty')}/>}

      {active.map(g => {
        const p = pct(g.saved, g.target);
        const daysLeft = Math.max(0, Math.ceil((new Date(g.deadline)-new Date())/(1000*60*60*24)));
        const sc = statusColor(g);
        return (
          <Card key={g.id} style={[s.goalCard, {borderLeftColor: sc}]}>
            <View style={s.goalHeader}>
              <Text style={{fontSize:28}}>{g.icon}</Text>
              <View style={{flex:1}}>
                <Text style={s.goalName}>{g.name}</Text>
                <Text style={s.goalSub}>{g.deadline} · {daysLeft} {t('goals.daysLeft')}</Text>
              </View>
              <View style={{alignItems:'flex-end'}}>
                <Text style={s.goalAmt}>{fmt(g.saved)}</Text>
                <Text style={s.goalTarget}>of {fmt(g.target)}</Text>
              </View>
            </View>
            <View style={s.progressWrap}>
              <View style={[s.progressBar, {width:`${p}%`, backgroundColor:sc}]}/>
            </View>
            <Text style={[s.goalStatus, {color:sc}]}>{p}% · {p<100?`${fmt(g.target-g.saved)} ${t('goals.toGo')}` : t('goals.done')}</Text>
            <Row style={{gap:8,marginTop:10}}>
              <Button label={t('goals.addFunds')} variant="success" style={{flex:1}} size="sm" onPress={() => handleAddFunds(g.id)}/>
              <Button label="✕" variant="danger" size="sm" onPress={() => handleDelete(g.id)}/>
            </Row>
          </Card>
        );
      })}

      {done.length > 0 && (
        <>
          <SectionTitle>{t('goals.completed')}🎉</SectionTitle>
          {done.map(g => (
            <Card key={g.id} style={s.doneCard}>
              <View style={s.goalHeader}>
                <Text style={{fontSize:24}}>{g.icon}</Text>
                <View style={{flex:1}}>
                  <Text style={s.goalName}>{g.name}</Text>
                  <Text style={{fontSize:11,color:colors.success}}>✓ {t('goals.completedMessage')}{fmt(g.target)}</Text>
                </View>
                <Button label="✕" variant="danger" size="sm" onPress={() => handleDelete(g.id)}/>
              </View>
            </Card>
          ))}
        </>
      )}

      <AddGoalModal visible={showAdd} onClose={() => setShowAdd(false)} onSave={handleAdd}/>
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
  goalCard: { marginBottom:12, borderLeftWidth:4, borderLeftColor:colors.success },
  goalHeader: { flexDirection:'row', alignItems:'center', gap:12, marginBottom:12 },
  goalName: { fontSize:14, fontWeight:'600', color:colors.text },
  goalSub: { fontSize:11, color:colors.muted, marginTop:2 },
  goalAmt: { fontSize:17, fontWeight:'700', color:colors.text },
  goalTarget: { fontSize:11, color:colors.muted },
  goalStatus: { fontSize:11, marginTop:6 },
  progressWrap: { backgroundColor:colors.surface2, borderRadius:100, height:8, overflow:'hidden' },
  progressBar: { height:'100%', borderRadius:100 },
  doneCard: { marginBottom:10, backgroundColor:'rgba(72,187,120,0.08)', borderColor:'rgba(72,187,120,0.3)' },
  overlay: { flex:1, justifyContent:'flex-end', backgroundColor:'rgba(0,0,0,0.6)' },
  sheet: { backgroundColor:colors.surface, borderTopLeftRadius:20, borderTopRightRadius:20, padding:24, paddingBottom:40 },
  handle: { width:36, height:4, backgroundColor:colors.border, borderRadius:2, alignSelf:'center', marginBottom:16 },
  sheetTitle: { fontSize:17, fontWeight:'700', color:colors.text, marginBottom:16 },
  label: { fontSize:12, color:colors.muted, marginBottom:4 },
  input: { backgroundColor:colors.surface2, borderWidth:1, borderColor:colors.border, borderRadius:10, color:colors.text, fontSize:14, padding:10, marginBottom:12 },
  iconGrid: { flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:16 },
  iconChip: { width:44, height:44, borderRadius:10, borderWidth:1, borderColor:colors.border, alignItems:'center', justifyContent:'center', backgroundColor:colors.surface2 },
  iconChipActive: { borderColor:colors.accent, backgroundColor:colors.accent+'22' },
});
