import React from 'react';
import { View, Text, ScrollView, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAppState } from '../state';
import { Card, SectionTitle, Button } from '../components/UI';
import { colors, spacing, radius } from '../theme';
import { useTranslation } from 'react-i18next';

const MENU = [
  {
    icon:'◈',
    label:'more.activities',
    sub:'more.activitiesSub',
    screen:'Activities'
  },
  {
    icon:'↻',
    label:'more.recurring',
    sub:'more.recurringSub',
    screen:'Recurring'
  },
  {
    icon:'⚡',
    label:'more.split',
    sub:'more.splitSub',
    screen:'Split'
  },
  {
    icon:'🏆',
    label:'more.challenges',
    sub:'more.challengesSub',
    screen:'Challenges'
  },
  {
    icon:'📊',
    label:'more.report',
    sub:'more.reportSub',
    screen:'Report'
  },
  {
    icon:'◉',
    label:'more.insights',
    sub:'more.insightsSub',
    screen:'Insights'
  },
];

export default function MoreScreen({ navigation }) {
  const { dispatch } = useAppState();
  const { t } = useTranslation();

  const resetAll = () => {
    Alert.alert(t('more.resetQuestion'),t('more.resetWarning'),
      {text: t('common.cancel'), style: 'cancel'},
      {text: t('more.reset'), style: 'destructive', onPress: async () => {
      await AsyncStorage.clear();
      dispatch({ type: 'RESET' });
    }},
    );
  };

  return (
  <SafeAreaView style={s.container} edges={['top']}>
    <ScrollView
      contentContainerStyle={s.scroll}
      showsVerticalScrollIndicator={false}
    >
      <Text style={s.title}>{t('more.title')}</Text>
      <Text style={s.sub}>{t('more.subtitle')}</Text>

      {MENU.map(m => (
        <TouchableOpacity key={m.screen} style={s.menuCard} activeOpacity={0.75}
          onPress={() => navigation.navigate(m.screen)}>
          <View style={s.menuIcon}>
            <Text style={{ fontSize: 20 }}>{m.icon}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={s.menuLabel}>{t(m.label)}</Text>
            <Text style={s.menuSub}>{t(m.sub)}</Text>
          </View>
          <Text style={{ color: colors.muted, fontSize: 18 }}>›</Text>
        </TouchableOpacity>
      ))}

      <TouchableOpacity
  style={s.menuCard}
  activeOpacity={0.75}
  onPress={() => navigation.navigate('Settings')}
>
  <View style={s.menuIcon}>
    <Text style={{ fontSize: 20 }}>⚙</Text>
  </View>

  <View style={{ flex: 1 }}>
    <Text style={s.menuLabel}>{t('more.settings')}</Text>
    <Text style={s.menuSub}>{t('more.settingsSub')}</Text>
  </View>

  <Text style={{ color: colors.muted, fontSize: 18 }}>
    ›
  </Text>
</TouchableOpacity>

      <View style={s.divider}/>
      <TouchableOpacity style={s.resetBtn} onPress={resetAll}>
        <Text style={s.resetText}>{t('more.reset')}</Text>
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

