import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput } from 'react-native';
import { useAppState, useComputed } from '../state';
import { Card, SectionTitle, Button, Row } from '../components/UI';
import { colors, spacing, radius } from '../theme';
import { useTranslation } from 'react-i18next';

export default function SplitScreen({ navigation }) {
  const { state, dispatch } = useAppState();
  const { fmt } = useComputed();
  const { t } = useTranslation();
  const [tab, setTab] = useState('equal');
  const [total, setTotal] = useState('');
  const [desc, setDesc] = useState('');
  const [count, setCount] = useState(2);
  const [extra, setExtra] = useState('');
  const [people, setPeople] = useState([{name:'You',amount:''},{name:'Friend',amount:''}]);
  const [result, setResult] = useState(null);

  const calcEqual = () => {
  const totalAmount = parseFloat(total) || 0;

  if (!totalAmount)
    return Alert.alert(t('split.enterTotal'));

  const ex = parseFloat(extra) || 0;
  const base = totalAmount / count;
  const myShare = base + ex;

  setResult({
    type: 'equal',
    total: totalAmount,
    base,
    myShare,
    others: (totalAmount - myShare) / (count - 1),
    count,
  });
};

const calcCustom = () => {
  const totalAmount = parseFloat(total) || 0;

  if (!totalAmount)
    return Alert.alert(t('split.enterTotal'));

  const allocated = people.reduce(
    (s, p) => s + (parseFloat(p.amount) || 0),
    0
  );

  const rem = totalAmount - allocated;

  setResult({
    type: 'custom',
    total: totalAmount,
    people,
    allocated,
    rem,
  });
};


  const logTx = (amount) => {
    if (!amount) return;
    dispatch({
      type:'ADD_TRANSACTION',
      payload:{ id:Date.now().toString(36), desc: desc || t('split.defaultDescription'), amount, date:new Date().toISOString().slice(0,10), type:'expense', categoryId:null }
    });
    Alert.alert(t('split.logged'),t('split.loggedMessage', { amount: fmt(amount) }));
  };

  return (
  <SafeAreaView style={s.container} edges={['top']}>
    <ScrollView
      contentContainerStyle={s.scroll}
      showsVerticalScrollIndicator={false}
    >
      <Text style={s.title}>{t('split.title')}</Text>
      <Text style={s.sub}>{t('split.subtitle')}</Text>

      <View style={s.tabs}>
        {['equal','custom'].map(mode => (
          <TouchableOpacity
           key={mode}
           style={[s.tab, tab===mode && s.tabActive]}
           onPress={() => { setTab(mode); setResult(null);}}
          >
       <Text style={[s.tabText, tab===mode && s.tabTextActive]}> {mode === 'equal'  ? t('split.equal')  : t('split.custom')}</Text>
       </TouchableOpacity>
        ))}
      </View>

      <Card>
        <Text style={s.label}>{t('split.totalBill')}</Text>
        <TextInput style={s.input} value={total} onChangeText={setTotal} keyboardType="numeric" placeholder="0" placeholderTextColor={colors.muted}/>
        <Text style={s.label}>{t('split.description')}</Text>
        <TextInput style={s.input} value={desc} onChangeText={setDesc} placeholder={t('split.descriptionPlaceholder')} placeholderTextColor={colors.muted}/>

        {tab === 'equal' ? (
          <>
            <Text style={s.label}>{t('split.people')}</Text>
            <View style={s.counter}>
              <TouchableOpacity style={s.counterBtn} onPress={()=>setCount(Math.max(2,count-1))}>
                <Text style={s.counterBtnText}>−</Text>
              </TouchableOpacity>
              <Text style={s.counterNum}>{count}</Text>
              <TouchableOpacity style={s.counterBtn} onPress={()=>setCount(Math.min(20,count+1))}>
                <Text style={s.counterBtnText}>+</Text>
              </TouchableOpacity>
            </View>
            <Text style={s.label}>{t('split.extra')}</Text>
            <TextInput style={s.input} value={extra} onChangeText={setExtra} keyboardType="numeric" placeholder="0" placeholderTextColor={colors.muted}/>
            <Button label={t('split.calculate')} variant="primary" onPress={calcEqual}/>
          </>
        ) : (
          <>
            {people.map((p,i) => (
              <View key={i} style={s.personRow}>
                <Text style={{fontSize:18,marginRight:8}}>{['😊','😎','🎉','🌟','🔥','💫'][i%6]}</Text>
                <TextInput style={[s.input,{flex:1,marginBottom:0,marginRight:8}]} value={p.name}
                  onChangeText={v=>{const np=[...people];np[i].name=v;setPeople(np);}}
                  placeholderTextColor={colors.muted}/>
                <TextInput style={[s.input,{width:90,marginBottom:0,textAlign:'right'}]} value={p.amount}
                  onChangeText={v=>{const np=[...people];np[i].amount=v;setPeople(np);}}
                  keyboardType="numeric" placeholder={t('split.amount')} placeholderTextColor={colors.muted}/>
              </View>
            ))}
            <Row style={{gap:8,marginTop:8,marginBottom:16}}>
              <Button label={t('split.addPerson')} variant="secondary" size="sm"
                onPress={()=>setPeople([...people,{name:`Person ${people.length+1}`,amount:''}])}/>
              {people.length>2&&<Button label={t('split.removePerson')} variant="danger" size="sm"
                onPress={()=>setPeople(people.slice(0,-1))}/>}
            </Row>
            <Button label={`${t('split.calculate')} →`} variant="primary" onPress={calcCustom}/>
          </>
        )}
      </Card>

      {result && (
        <Card style={s.resultCard}>
          <Text style={s.resultTitle}> {t('split.results')}</Text>
          {result.type==='equal' ? (
            <>
              <View style={s.resultRow}><Text style={s.resultKey}>{t('split.totalBill')}</Text><Text style={s.resultVal}>{fmt(result.total)}</Text></View>
              <View style={s.resultRow}><Text style={s.resultKey}>{t('split.basePerPerson')}</Text><Text style={s.resultVal}>{fmt(result.base)}</Text></View>
              <View style={[s.resultRow,s.resultHighlight]}>
                <Text style={[s.resultKey,{color:colors.success,fontWeight:'700'}]}>{t('split.yourShare')}</Text>
                <Text style={[s.resultVal,{color:colors.success,fontSize:20,fontWeight:'700'}]}>{fmt(result.myShare)}</Text>
              </View>
              {result.count>1&&<View style={s.resultRow}><Text style={s.resultKey}>{t('split.otherPerson')}</Text><Text style={s.resultVal}>{fmt(result.others)}</Text></View>}
              <Button label={t('split.logShare', {amount: fmt(result.myShare)})} variant="primary" style={{marginTop:12}} onPress={()=>logTx(result.myShare)}/>
            </>
          ) : (
            <>
              {result.people.map((p,i)=>(
                <View key={i} style={s.resultRow}><Text style={s.resultKey}>{p.name}</Text><Text style={s.resultVal}>{fmt(parseFloat(p.amount)||0)}</Text></View>
              ))}
              <View style={s.resultRow}>
                <Text style={s.resultKey}>{t('split.totalAllocated')}</Text>
                <Text style={[s.resultVal,{color:Math.abs(result.rem)<0.01?colors.success:colors.warning}]}>
                  {fmt(result.allocated)} {Math.abs(result.rem)<0.01?  t('split.done'):`(${fmt(Math.abs(result.rem))} ${result.rem>0? t('split.remaining'): t('split.over')})`}
                </Text>
              </View>
              {Math.abs(result.rem)<0.01&&<Button label={t('split.logMyShare', {amount: fmt(parseFloat(result.people[0].amount) || 0)})}/>}
            </>
          )}
        </Card>
      )}
        </ScrollView>
  </SafeAreaView>
);}


const s = StyleSheet.create({
  container: { flex:1, backgroundColor:colors.bg },
  scroll: {
  padding: spacing.xl,
  paddingTop: spacing.xl + 8,
  paddingBottom: 40,
},
  title: { fontSize:22, fontWeight:'700', color:colors.text, marginBottom:4 },
  sub: { fontSize:13, color:colors.muted, marginBottom:20, lineHeight:20 },
  tabs: { flexDirection:'row', backgroundColor:colors.surface2, borderRadius:10, padding:3, marginBottom:16, gap:3 },
  tab: { flex:1, paddingVertical:8, borderRadius:8, alignItems:'center' },
  tabActive: { backgroundColor:colors.surface },
  tabText: { fontSize:13, color:colors.muted },
  tabTextActive: { color:colors.text, fontWeight:'500' },
  label: { fontSize:12, color:colors.muted, marginBottom:4 },
  input: { backgroundColor:colors.surface2, borderWidth:1, borderColor:colors.border, borderRadius:10, color:colors.text, fontSize:14, padding:10, marginBottom:12 },
  counter: { flexDirection:'row', alignItems:'center', gap:20, marginBottom:16 },
  counterBtn: { width:40, height:40, borderRadius:10, backgroundColor:colors.surface2, alignItems:'center', justifyContent:'center', borderWidth:1, borderColor:colors.border },
  counterBtnText: { fontSize:22, color:colors.text, fontWeight:'500' },
  counterNum: { fontSize:28, fontWeight:'700', color:colors.text, minWidth:40, textAlign:'center' },
  personRow: { flexDirection:'row', alignItems:'center', marginBottom:10 },
  resultCard: { backgroundColor:'rgba(72,187,120,0.08)', borderColor:'rgba(72,187,120,0.25)' },
  resultTitle: { fontSize:14, fontWeight:'700', color:colors.text, marginBottom:12 },
  resultRow: { flexDirection:'row', justifyContent:'space-between', paddingVertical:8, borderBottomWidth:1, borderBottomColor:'rgba(72,187,120,0.1)' },
  resultHighlight: { backgroundColor:'rgba(72,187,120,0.1)', marginHorizontal:-4, paddingHorizontal:4, borderRadius:8, borderBottomWidth:0 },
  resultKey: { fontSize:14, color:colors.muted },
  resultVal: { fontSize:14, fontWeight:'600', color:colors.text },
});
