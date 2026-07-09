import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppState, useComputed, uid, today } from '../state';
import { Card, SectionTitle, Button, Input, Row, Empty } from '../components/UI';
import { colors, spacing, radius } from '../theme';
import { useTranslation } from 'react-i18next';

export default function ActivitiesScreen({ navigation }) {
  const { state, dispatch } = useAppState();
  const { fmt } = useComputed();
  const [tab, setTab] = useState('planned');
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState('');
  const [cost, setCost] = useState('');
  const [date, setDate] = useState(today());
  const [notes, setNotes] = useState('');
  const { t } = useTranslation();

  const { activities, budgets } = state;
  const planned = activities.filter(a => a.status === 'planned');
  const done    = activities.filter(a => a.status === 'done');
  const items   = tab === 'planned' ? planned : done;

  const addActivity = () => {
    if (!name.trim()) return Alert.alert(t('activities.name'));
    const icons = ['🎯','🎉','🍽️','🎬','🏃','✈️','🛍️','🎸','🏖️','🎮'];
    dispatch({ type: 'ADD_ACTIVITY', payload: { id: uid(), name: name.trim(), icon: icons[Math.floor(Math.random()*icons.length)], cost: parseFloat(cost)||0, date, notes: notes.trim(), status: 'planned', categoryId: null } });
    setName(''); setCost(''); setNotes(''); setShowAdd(false);
  };

  const completeActivity = (a) => {
    Alert.alert('Mark as done?', t('activities.mark_done'), t('activities.mark_done_desc'), [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Done', onPress: () => {
        dispatch({ type: 'UPDATE_ACTIVITY', payload: { id: a.id, status: 'done' } });
        dispatch({ type: 'ADD_TRANSACTION', payload: { id: uid(), date: a.date, desc: a.name, amount: a.cost, categoryId: a.categoryId, type: 'expense' } });
      }},
    ]);
  };

  return (
  <SafeAreaView style={s.container} edges={['top']}>
    <ScrollView
      contentContainerStyle={s.scroll}
      showsVerticalScrollIndicator={false}
    >
      <Row style={{ justifyContent: 'space-between', marginBottom: 16 }}>
        <Text style={s.title}>{t('activities.title')}</Text>
        <Button label={t('activities.done_button')} size="sm" onPress={() => setShowAdd(true)} />
      </Row>

      <View style={s.tabs}>
        {[['planned', `${t('activities.planned')} (${planned.length})`], ['done', `${t('activities.done')} (${done.length})`],].map(([t, l]) => (
          <TouchableOpacity key={t} style={[s.tab, tab === t && s.tabActive]} onPress={() => setTab(t)}>
            <Text style={[s.tabText, tab === t && s.tabTextActive]}>{l}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {!items.length && (
  <Empty
    icon={tab === 'planned' ? '📅' : '✅'} message={  tab === 'planned' ? t('activities.no_planned')  : t('activities.no_done')    }/>)}

      {items.map(a => {
        const cat = budgets.find(b => b.id === a.categoryId);
        return (
          <Card key={a.id} style={{ marginBottom: 10 }}>
            <Row style={{ justifyContent: 'space-between', marginBottom: a.notes ? 8 : 12 }}>
              <Row style={{ gap: 10, flex: 1 }}>
                <View style={{ width: 40, height: 40, borderRadius: 10, backgroundColor: colors.accent+'22', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 20 }}>{a.icon||'🎯'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontWeight: '500', fontSize: 14, color: colors.text }} numberOfLines={1}>{ a.name}</Text>
                  <Text style={{ fontSize: 11, color: colors.muted }}>{a.date}{cat ? ' · ' + t(`budget.${cat.key}`) : ''}</Text>
                </View>
              </Row>
              <Text style={{ fontWeight: '600', fontSize: 15, color: colors.text }}>{fmt(a.cost)}</Text>
            </Row>
            {a.notes ? <Text style={{ fontSize: 12, color: colors.muted, marginBottom: 12 }}>{a.notes}</Text> : null}
            <Row style={{ gap: 8 }}>
              {tab === 'planned' && <Button label="✓ Done" variant="success" size="sm" style={{ flex: 1 }} onPress={() => completeActivity(a)}/>}
              <Button label={t('activities.delete_button')}  variant="danger" size="sm" style={{ flex: 1 }}
                onPress={() => { Alert.alert (t('activities.delete_confirm'),'',[ {text:'Cancel',style:'cancel'}, {text:'Delete',style:'destructive',onPress:()=>dispatch({type:'DELETE_ACTIVITY',payload:a.id})} ]); }}/>
            </Row>
          </Card>
        );
      })}

      <Modal visible={showAdd} animationType="slide" transparent onRequestClose={() => setShowAdd(false)}>
        <View style={s.overlay}><View style={s.sheet}>
          <View style={s.handle}/>
          <Text style={s.sheetTitle}>{t('activities.plan_title')}</Text>
          <Input label={t('activities.name')} value={name} onChangeText={setName} placeholder={t('activities.name_placeholder')}/>
          <Row style={{ gap: 10 }}>
            <View style={{ flex: 1 }}><Input label={t('activities.cost')} value={cost} onChangeText={setCost} keyboardType="numeric" placeholder="0"/></View>
            <View style={{ flex: 1 }}><Input label={t('activities.date')} value={date} onChangeText={setDate} placeholder="YYYY-MM-DD"/></View>
          </Row>
          <Input label={t('activities.notes')} value={notes} onChangeText={setNotes} placeholder={t('activities.notes_placeholder')}/>
          <Row style={{ gap: 10 }}>
            <Button label={t('common.cancel')} variant="secondary" style={{ flex: 1 }} onPress={() => setShowAdd(false)}/>
            <Button label={t('activities.save')} style={{ flex: 1 }} onPress={addActivity}/>
          </Row>  
        </View></View>
      </Modal>
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
  title:     { fontSize: 22, fontWeight: '700', color: colors.text },
  tabs:      { flexDirection: 'row', backgroundColor: colors.surface2, borderRadius: 10, padding: 3, marginBottom: 16, gap: 2 },
  tab:       { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center' },
  tabActive: { backgroundColor: colors.surface },
  tabText:   { fontSize: 13, color: colors.muted },
  tabTextActive: { color: colors.text, fontWeight: '500' },
  overlay:   { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet:     { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  handle:    { width: 36, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetTitle:{ fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 16 },
});
