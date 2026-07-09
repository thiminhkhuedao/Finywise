import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput } from 'react-native';
import { useAppState, useComputed } from '../state';
import { Card, SectionTitle, Button, TipBox, Row } from '../components/UI';
import { colors, spacing, radius } from '../theme';
import { useTranslation } from 'react-i18next';

const SUB_DB = {
  'Netflix':        {icon:'🎬',cat:'Entertainment',alt:'Disney+ (cheaper)'},
  'Spotify':        {icon:'🎵',cat:'Music',alt:'YouTube Music'},
  'Disney+':        {icon:'🏰',cat:'Entertainment',alt:'Apple TV+'},
  'Amazon Prime':   {icon:'📦',cat:'Shopping',alt:'Free delivery on big orders'},
  'Apple TV+':      {icon:'🍎',cat:'Entertainment',alt:'Disney+ bundle'},
  'Adobe CC':       {icon:'🎨',cat:'Software',alt:'Affinity Suite (one-time)'},
  'Microsoft 365':  {icon:'💼',cat:'Software',alt:'LibreOffice (free)'},
  'Gym':            {icon:'💪',cat:'Health',alt:'Home workout apps'},
  'NordVPN':        {icon:'🔒',cat:'Software',alt:'Proton VPN free tier'},
  'iCloud':         {icon:'☁️',cat:'Software',alt:'Google Photos (free)'},
  'Headspace':      {icon:'🧘',cat:'Health',alt:'Insight Timer (free)'},
  'Duolingo':       {icon:'🦉',cat:'Education',alt:'Free Duolingo tier'},
};

const CANCEL_STEPS = [
  'Log in to the service website (not the app).',
  'Go to Account Settings → Subscription → Cancel.',
  'If not found: email support@[service].com with subject "Cancel my subscription".',
  'Check your bank statement 30 days later to confirm.',
];

const NEGOTIATE_STEPS = [
  "Call or chat the support team.",
  "Say: 'I've been a subscriber for X years and considering cancelling due to price increases.'",
  "Wait — they often offer 1–3 months at 50% off.",
  "If not: 'I've seen lower rates for new subscribers. Can you match that?'",
  "Best time: Tuesday–Thursday 10am–2pm for retention agents.",
];

function ScriptModal({ visible, sub, type, onClose }) {
  const { t } = useTranslation();
  if (!sub) return null;
  const steps = type === 'cancel' ? CANCEL_STEPS : NEGOTIATE_STEPS;
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.overlay}>
        <View style={s.sheet}>
          <View style={s.handle}/>
          <Text style={s.sheetTitle}>{type==='cancel'? t('subscriptions.howCancel') : t('subscriptions.negotiateWith')} {sub.name}</Text>
          {steps.map((step,i) => (
            <View key={i} style={s.stepRow}>
              <View style={[s.stepNum,{backgroundColor:type==='cancel'?colors.danger:colors.warning}]}>
                <Text style={s.stepNumText}>{i+1}</Text>
              </View>
              <Text style={s.stepText}>{step}</Text>
            </View>
          ))}
          <Button label={t('common.close')} variant="secondary" onPress={onClose} style={{marginTop:16}}/>
        </View>
      </View>
    </Modal>
  );
}

function AddSubModal({ visible, onClose, onSave }) {
  const { t } = useTranslation();
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('💳');
  const [amount, setAmount] = useState('');

  const prefill = (n) => {
    const db = SUB_DB[n];
    if (db) { setName(n); setIcon(db.icon); }
  };

  const submit = () => {
    if (!name) return Alert.alert(t('subscriptions.enterName'));
    const db = Object.entries(SUB_DB).find(([k])=>name.toLowerCase().includes(k.toLowerCase()));
    onSave({ name, icon, amount:parseFloat(amount)||0, alternative:db?db[1].alt:null, status:'review', usageLevel:'monthly', previousAmount:null });
    setName(''); setIcon('💳'); setAmount(''); onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={s.overlay}>
        <ScrollView style={s.sheet} showsVerticalScrollIndicator={false}>
          <View style={s.handle}/>
          <Text style={s.sheetTitle}>{t('subscriptions.addSubscription')}</Text>
          <Text style={s.label}>{t('subscriptions.quickAdd')}</Text>
          <View style={s.quickAdd}>
            {Object.entries(SUB_DB).slice(0,8).map(([n,db])=>(
              <TouchableOpacity key={n} style={s.quickChip} onPress={()=>prefill(n)}>
                <Text style={s.quickChipText}>{db.icon} {n}</Text>
              </TouchableOpacity>
            ))}
          </View>
          <Text style={s.label}>{t('subscriptions.serviceName')}</Text>
          <TextInput style={s.input} value={name} onChangeText={setName} placeholder={t('subscriptions.servicePlaceholder')} placeholderTextColor={colors.muted}/>
          <Row style={{gap:8}}>
            <View style={{flex:1}}>
              <Text style={s.label}>{t('subscriptions.icon')}</Text>
              <TextInput style={s.input} value={icon} onChangeText={setIcon} maxLength={2} placeholderTextColor={colors.muted}/>
            </View>
            <View style={{flex:2}}>
              <Text>{t('subscriptions.monthlyCost')}</Text>
              <TextInput style={s.input} value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="0" placeholderTextColor={colors.muted}/>
            </View>
          </Row>
          <Row style={{gap:8}}>
            <Button label={t('common.cancel')} variant="secondary" style={{flex:1}} onPress={onClose}/>
            <Button label={t('common.add')} variant="primary" style={{flex:1}} onPress={submit}/>
          </Row>
        </ScrollView>
      </View>
    </Modal>
  );
}

export default function SubscriptionsScreen({ navigation }) {
  const { state, dispatch } = useAppState();
  const { fmt } = useComputed();
  const [showAdd, setShowAdd] = useState(false);
  const [scriptModal, setScriptModal] = useState({ visible:false, sub:null, type:'cancel' });
  const { t } = useTranslation();
  
  const subs = state.subscriptions || [];
  const totalMo = subs.reduce((s,x)=>s+x.amount, 0);
  const savings = subs.filter(x=>x.status==='cancel').reduce((s,x)=>s+x.amount, 0);
  const toReview = subs.filter(x=>x.status==='review');
  const toCancel = subs.filter(x=>x.status==='cancel');
  const toNeg    = subs.filter(x=>x.status==='negotiate');
  const kept     = subs.filter(x=>x.status==='keep');

  const setStatus = (id, status) => dispatch({ type:'SET_SUB_STATUS', payload:{id,status} });
  const setUsage  = (id, level)  => dispatch({ type:'SET_SUB_USAGE',  payload:{id,level}  });
  const deleteSub = (id) => {
    Alert.alert( t('subscriptions.removeTitle'), '', [
      {text:t('common.cancel'),style:'cancel'},
      {text:t('common.remove'),style:'destructive',onPress:()=>dispatch({type:'DELETE_SUB',payload:id})}
    ]);
  };

  const handleAdd = (data) => {
    dispatch({ type:'ADD_SUB', payload:{ ...data, id:Date.now().toString(36), lastCharged:new Date().toISOString().slice(0,10) } });
  };

  const usageColors = { daily:colors.success, weekly:colors.success, monthly:colors.accent, rarely:colors.warning, never:colors.danger };

  const renderSub = (sub) => {
    const statusColors = { keep:colors.success, cancel:colors.danger, negotiate:colors.warning, review:colors.accent };
    const sc = statusColors[sub.status] || colors.muted;
    return (
      <Card key={sub.id} style={[s.subCard,{borderColor:sc+'44'}]}>
        <View style={s.subHeader}>
          <Text style={{fontSize:26}}>{sub.icon||'💳'}</Text>
          <View style={{flex:1}}>
            <Text style={s.subName}>{sub.name}</Text>
            <Text style={s.subMeta}>{sub.category} · {sub.frequency}</Text>
          </View>
          <View style={{alignItems:'flex-end'}}>
            <Text style={[s.subAmt,{color:sc}]}>{fmt(sub.amount)}</Text>
            <Text style={{fontSize:10,color:colors.muted}}>/month</Text>
          </View>
        </View>

        {sub.alternative && (
          <View style={s.altBox}>
            <Text style={{fontSize:12,color:colors.muted}}>💡 <Text style={{color:colors.accent2,fontWeight:'500'}}>Alternative: </Text>{sub.alternative}</Text>
          </View>
        )}

        <Text style={s.usageLabel}>{t('subscriptions.usage')}</Text>
        <View style={s.usageRow}>
          {['daily','weekly','monthly','rarely','never'].map(u=>(
            <TouchableOpacity 
            key={u} onPress={()=>setUsage(sub.id,u)}
              style={[s.usageChip,{backgroundColor:sub.usageLevel===u?usageColors[u]:'transparent',borderColor:sub.usageLevel===u?usageColors[u]:colors.border}]}>
              <Text style={[s.usageText,{color:sub.usageLevel===u?'#fff':colors.muted}]}>{t(`subscriptions.${u}`)}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={s.actionRow}>
          <TouchableOpacity style={[s.statusBtn,sub.status==='keep'&&s.statusBtnActive]} onPress={()=>setStatus(sub.id,'keep')}>
            <Text style={[s.statusBtnText,sub.status==='keep'&&{color:colors.success}]}>{t('subscriptions.keep')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.statusBtn,sub.status==='cancel'&&s.statusBtnDanger]} onPress={()=>setStatus(sub.id,'cancel')}>
            <Text style={[s.statusBtnText,sub.status==='cancel'&&{color:colors.danger}]}>{t('subscriptions.cancel')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.statusBtn,sub.status==='negotiate'&&s.statusBtnWarn]} onPress={()=>setStatus(sub.id,'negotiate')}>
            <Text style={[s.statusBtnText,sub.status==='negotiate'&&{color:colors.warning}]}>{t('subscriptions.negotiateBtn')}</Text>
          </TouchableOpacity>
        </View>

        <View style={s.actionRow2}>
          {sub.status==='cancel'&&(
            <Button label={t('subscriptions.howToCancel')}  variant="primary" size="sm" style={{flex:1}}
              onPress={()=>setScriptModal({visible:true,sub,type:'cancel'})}/>
          )}
          {sub.status==='negotiate'&&(
            <Button label={t('subscriptions.script')}  variant="primary" size="sm" style={{flex:1}}
              onPress={()=>setScriptModal({visible:true,sub,type:'negotiate'})}/>
          )}
          <Button label="✕" variant="danger" size="sm" onPress={()=>deleteSub(sub.id)}/>
        </View>
      </Card>
    );
  };

  return (
  <SafeAreaView style={s.container} edges={['top']}>
    <ScrollView
      contentContainerStyle={s.scroll}
      showsVerticalScrollIndicator={false}
    >
      <Text style={s.title}>{t('subscriptions.title')}</Text>
      <Text style={s.sub}>{t('subscriptions.subtitle')}</Text>

      <View style={s.summaryCard}>
        <View style={{flexDirection:'row',justifyContent:'space-between'}}>
          <View>
            <Text style={s.summaryLabel}>{t('subscriptions.totalMonth')}</Text>
            <Text style={[s.summaryBig,{color:colors.danger}]}>{fmt(totalMo)}</Text>
            <Text style={{fontSize:10,color:colors.muted}}>{fmt(totalMo*12)}/{t('subscriptions.year')}</Text>
          </View>
          <View style={{alignItems:'flex-end'}}>
            <Text style={s.summaryLabel}>{t('subscriptions.saving')}</Text>
            <Text style={[s.summaryBig,{color:colors.success}]}> {fmt(savings)}{t('subscriptions.monthShort')}</Text>
          </View>
        </View>
        <View style={{flexDirection:'row',gap:20,marginTop:14}}>
          {[[t('subscriptions.total'),subs.length,colors.text], [t('subscriptions.cancel'),toCancel.length,colors.danger], [t('subscriptions.negotiate'),toNeg.length,colors.warning], [t('subscriptions.review'),toReview.length,colors.accent]].map(([l,n,c])=>(
            <View key={l}><Text style={{fontSize:10,color:colors.muted}}>{l}</Text><Text style={{fontSize:15,fontWeight:'700',color:c}}>{n}</Text></View>
          ))}
        </View>
      </View>

      <Button label={t('subscriptions.add')} variant="primary" onPress={()=>setShowAdd(true)} style={{marginBottom:16}}/>

      {!subs.length && <View style={s.empty}><Text style={{fontSize:36}}>💳</Text><Text style={{color:colors.muted,fontSize:13,marginTop:8,textAlign:'center'}}>{t('subscriptions.empty')}</Text></View>}

      {toReview.length>0&&<><SectionTitle>{t('subscriptions.needReview')} ({toReview.length})</SectionTitle>{toReview.map(renderSub)}</>}
      {toCancel.length>0&&<><SectionTitle style={{color:colors.danger}}>{t('subscriptions.cancelThese')} {fmt(savings)}/mo</SectionTitle>{toCancel.map(renderSub)}</>}
      {toNeg.length>0&&<><SectionTitle style={{color:colors.warning}}>{t('subscriptions.negotiateThese')}</SectionTitle>{toNeg.map(renderSub)}</>}
      {kept.length>0&&<><SectionTitle>{t('subscriptions.keeping')} ({kept.length})</SectionTitle>{kept.map(renderSub)}</>}

      <TipBox>{t('subscriptions.yearSaving', {amount: fmt(savings * 12)})}</TipBox>

      <AddSubModal visible={showAdd} onClose={()=>setShowAdd(false)} onSave={handleAdd}/>
      <ScriptModal {...scriptModal} onClose={()=>setScriptModal({...scriptModal,visible:false})}/>
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
  summaryCard: { backgroundColor:'#1e1a3a', borderWidth:1, borderColor:'#3a3560', borderRadius:radius.md, padding:18, marginBottom:16 },
  summaryLabel: { fontSize:10, color:colors.muted },
  summaryBig: { fontSize:28, fontWeight:'700', letterSpacing:-1 },
  subCard: { marginBottom:10, borderWidth:1 },
  subHeader: { flexDirection:'row', alignItems:'center', gap:10, marginBottom:10 },
  subName: { fontSize:14, fontWeight:'600', color:colors.text },
  subMeta: { fontSize:11, color:colors.muted, marginTop:2 },
  subAmt: { fontSize:18, fontWeight:'700' },
  altBox: { backgroundColor:'rgba(79,209,197,0.07)', borderWidth:1, borderColor:'rgba(79,209,197,0.2)', borderRadius:8, padding:8, marginBottom:10 },
  usageLabel: { fontSize:11, color:colors.muted, marginBottom:6 },
  usageRow: { flexDirection:'row', gap:6, flexWrap:'wrap', marginBottom:10 },
  usageChip: { paddingHorizontal:10, paddingVertical:4, borderRadius:100, borderWidth:1 },
  usageText: { fontSize:11 },
  actionRow: { flexDirection:'row', gap:6, marginBottom:8 },
  actionRow2: { flexDirection:'row', gap:6 },
  statusBtn: { flex:1, paddingVertical:7, borderRadius:8, borderWidth:1, borderColor:colors.border, alignItems:'center', backgroundColor:colors.surface2 },
  statusBtnActive: { borderColor:colors.success, backgroundColor:'rgba(72,187,120,0.1)' },
  statusBtnDanger: { borderColor:colors.danger, backgroundColor:'rgba(245,101,101,0.1)' },
  statusBtnWarn: { borderColor:colors.warning, backgroundColor:'rgba(237,137,54,0.1)' },
  statusBtnText: { fontSize:12, color:colors.muted, fontWeight:'500' },
  empty: { alignItems:'center', padding:40 },
  overlay: { flex:1, justifyContent:'flex-end', backgroundColor:'rgba(0,0,0,0.6)' },
  sheet: { backgroundColor:colors.surface, borderTopLeftRadius:20, borderTopRightRadius:20, padding:24, paddingBottom:40, maxHeight:'90%' },
  handle: { width:36, height:4, backgroundColor:colors.border, borderRadius:2, alignSelf:'center', marginBottom:16 },
  sheetTitle: { fontSize:17, fontWeight:'700', color:colors.text, marginBottom:16 },
  label: { fontSize:12, color:colors.muted, marginBottom:4 },
  input: { backgroundColor:colors.surface2, borderWidth:1, borderColor:colors.border, borderRadius:10, color:colors.text, fontSize:14, padding:10, marginBottom:12 },
  quickAdd: { flexDirection:'row', flexWrap:'wrap', gap:8, marginBottom:16 },
  quickChip: { paddingHorizontal:12, paddingVertical:6, borderRadius:8, borderWidth:1, borderColor:colors.border, backgroundColor:colors.surface2 },
  quickChipText: { fontSize:12, color:colors.text },
  stepRow: { flexDirection:'row', gap:10, marginBottom:12 },
  stepNum: { width:24, height:24, borderRadius:12, alignItems:'center', justifyContent:'center', flexShrink:0, marginTop:1 },
  stepNumText: { fontSize:11, fontWeight:'700', color:'#fff' },
  stepText: { flex:1, fontSize:13, color:colors.muted, lineHeight:20 },
});
