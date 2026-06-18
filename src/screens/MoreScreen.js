import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppState } from '../state';
import { SectionTitle } from '../components/UI';
import { colors, spacing, radius } from '../theme';

const MENU = [
  { icon:'◈', label:'Activities',         sub:'Plan outings & events',             screen:'Activities'  },
  { icon:'↻', label:'Recurring Expenses', sub:'Auto-deduct fixed monthly costs',   screen:'Recurring'   },
  { icon:'⚡', label:'Bill Split',         sub:'Split bills fairly with friends',   screen:'Split'       },
  { icon:'🏆', label:'Challenges',         sub:'Spending streaks & habit goals',    screen:'Challenges'  },
  { icon:'📊', label:'Monthly Report',     sub:'Your full month in numbers',        screen:'Report'      },
  { icon:'◉', label:'Insights',           sub:'Charts, trends & smart tips',       screen:'Insights'    },
];

export default function MoreScreen({ navigation }) {
  const { dispatch } = useAppState();

  const resetAll = () => {
    Alert.alert('Reset all data?', 'This cannot be undone.', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Reset', style: 'destructive', onPress: async () => {
        await AsyncStorage.clear();
        dispatch({ type: 'RESET' });
      }},
    ]);
  };

  return (
  <SafeAreaView style={s.container} edges={['top']}>
    <ScrollView
      contentContainerStyle={s.scroll}
      showsVerticalScrollIndicator={false}
    >
      <Text style={s.title}>More</Text>
      <Text style={s.sub}>All FinyWise features</Text>

      {MENU.map(m => (
        <TouchableOpacity key={m.screen} style={s.menuCard} activeOpacity={0.75}
          onPress={() => navigation.navigate(m.screen)}>
          <View style={s.menuIcon}>
            <Text style={{ fontSize: 20 }}>{m.icon}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.menuLabel}>{m.label}</Text>
            <Text style={s.menuSub}>{m.sub}</Text>
          </View>
          <Text style={{ color: colors.muted, fontSize: 18 }}>›</Text>
        </TouchableOpacity>
      ))}

      <View style={s.divider}/>
      <TouchableOpacity style={s.resetBtn} onPress={resetAll}>
        <Text style={s.resetText}>Reset all data</Text>
      </TouchableOpacity>
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
  title:      { fontSize: 22, fontWeight: '700', color: colors.text, marginBottom: 4 },
  sub:        { fontSize: 13, color: colors.muted, marginBottom: 20 },
  menuCard:   { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: 14, marginBottom: 10, flexDirection: 'row', alignItems: 'center', gap: 14 },
  menuIcon:   { width: 44, height: 44, borderRadius: 12, backgroundColor: 'rgba(124,106,247,0.1)', alignItems: 'center', justifyContent: 'center' },
  menuLabel:  { fontSize: 14, fontWeight: '500', color: colors.text },
  menuSub:    { fontSize: 12, color: colors.muted, marginTop: 2 },
  divider:    { height: 1, backgroundColor: colors.border, marginVertical: 20 },
  resetBtn:   { padding: 14, borderRadius: radius.sm, borderWidth: 1, borderColor: 'rgba(245,101,101,0.3)', backgroundColor: 'rgba(245,101,101,0.08)', alignItems: 'center' },
  resetText:  { fontSize: 14, color: colors.danger, fontWeight: '500' },
});
