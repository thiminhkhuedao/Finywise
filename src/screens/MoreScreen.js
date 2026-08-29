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
    label:'more.activities',
    sub:'more.activitiesSub',
    screen:'Activities'
  },
  {
    label:'more.recurring',
    sub:'more.recurringSub',
    screen:'Recurring'
  },
  {
    label:'more.split',
    sub:'more.splitSub',
    screen:'Split'
  },
  {
    label:'more.challenges',
    sub:'more.challengesSub',
    screen:'Challenges'
  },
  {
    label:'more.report',
    sub:'more.reportSub',
    screen:'Report'
  },
  {
    label:'more.insights',
    sub:'more.insightsSub',
    screen:'Insights'
  },
  {
    label:'more.settings',
    sub:'more.settingsSub',
    screen: 'Settings'
  }
];

export default function MoreScreen({ navigation }) {
  const { dispatch } = useAppState();
  const { t } = useTranslation();

  const resetAll = () => {
  Alert.alert(
    t('more.resetQuestion'),
    t('more.resetWarning'),
    [
      {
        text: t('common.cancel'),
        style: 'cancel',
      },
      {
        text: t('more.reset'),
        style: 'destructive',
        onPress: async () => {
          try {
            await AsyncStorage.removeItem('finywise_state_v1');
            dispatch({ type: 'RESET' });
          } catch (error) {
            console.error('Error resetting data:', error);
            Alert.alert(
              'Error',
              'Unable to reset your data. Please try again.'
            );
          }
        },
      },
    ]
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
          <View style={{ flex: 1 }}>
            <Text style={s.menuLabel}>{t(m.label)}</Text>
            <Text style={s.menuSub}>{t(m.sub)}</Text>
          </View>
          <Text style={{ color: colors.muted, fontSize: 18 }}>›</Text>
        </TouchableOpacity>
      ))}

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

