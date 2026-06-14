import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { useAppState, uid } from '../state';
import { Input, Button, Card } from '../components/UI';
import { colors, spacing, radius } from '../theme';

export default function OnboardingScreen({ navigation }) {
  const { dispatch } = useAppState();
  const [name, setName] = useState('');
  const [currency, setCurrency] = useState('€');
  const [income, setIncome] = useState('');
  const [savingsGoal, setSavingsGoal] = useState('20');

  const currencies = ['€','$','£','¥'];

  const submit = () => {
    if (!name.trim()) return Alert.alert('Please enter your name.');
    const inc = parseFloat(income) || 0;
    const profile = { name: name.trim(), currency, monthlyIncome: inc, savingsGoal: parseFloat(savingsGoal) || 20 };
    dispatch({ type: 'SET_PROFILE', payload: profile });
    [['Housing','🏠',0.35,'#7c6af7'],['Food','🍔',0.15,'#4fd1c5'],['Transport','🚌',0.1,'#ed8936'],['Fun','🎮',0.1,'#48bb78']]
      .forEach(([n,icon,r,color]) => dispatch({ type:'ADD_BUDGET', payload:{ id:uid(), name:n, icon, allocated:inc*r, spent:0, color } }));
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
      <View style={s.hero}>
        <Text style={s.icon}>✦</Text>
        <Text style={s.title}>Welcome to FinyWise</Text>
        <Text style={s.sub}>Your smart financial co-pilot.{'\n'}Let's set up your profile.</Text>
      </View>
      <Card>
        <Input label="Your name" value={name} onChangeText={setName} placeholder="e.g. Alex"/>
        <Text style={s.label}>Currency</Text>
        <View style={s.currencyRow}>
          {currencies.map(c => (
            <TouchableOpacity key={c} style={[s.currencyBtn, currency===c && s.currencyBtnActive]} onPress={() => setCurrency(c)}>
              <Text style={[s.currencyText, currency===c && s.currencyTextActive]}>{c}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Input label="Monthly income" value={income} onChangeText={setIncome} keyboardType="numeric" placeholder="2000"/>
        <Input label="Savings goal (%)" value={savingsGoal} onChangeText={setSavingsGoal} keyboardType="numeric" placeholder="20"/>
        <Button label="Get started →" onPress={submit}/>
      </Card>
      <Text style={s.note}>Data stays on your device. No account needed.</Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container:           { flex: 1, backgroundColor: colors.bg },
  scroll:              { padding: spacing.xl, paddingTop: 60 },
  hero:                { alignItems: 'center', marginBottom: 28 },
  icon:                { fontSize: 52, marginBottom: 14 },
  title:               { fontSize: 26, fontWeight: '700', color: colors.text, marginBottom: 8, textAlign: 'center' },
  sub:                 { fontSize: 14, color: colors.muted, lineHeight: 22, textAlign: 'center' },
  label:               { fontSize: 12, color: colors.muted, marginBottom: 8, marginTop: 4 },
  currencyRow:         { flexDirection: 'row', gap: 10, marginBottom: 16 },
  currencyBtn:         { flex: 1, paddingVertical: 10, borderRadius: radius.sm, borderWidth: 1, borderColor: colors.border, alignItems: 'center', backgroundColor: colors.surface2 },
  currencyBtnActive:   { borderColor: colors.accent, backgroundColor: colors.accent + '22' },
  currencyText:        { fontSize: 16, color: colors.muted },
  currencyTextActive:  { color: colors.accent, fontWeight: '600' },
  note:                { textAlign: 'center', fontSize: 11, color: colors.muted, marginTop: 14 },
});
