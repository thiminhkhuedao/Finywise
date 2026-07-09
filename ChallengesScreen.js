import React from 'react';
import { View, Text, ScrollView, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useAppState } from '../state';
import { Card, SectionTitle, Button, TipBox } from '../components/UI';
import { colors, spacing, radius } from '../theme';

const CHALLENGES = [
  { id:'nospend3', nameKey:'challenges.items.nospend3.name', descKey:'challenges.items.nospend3.desc', icon:'🧘', days:3, reward:'🏅' },
  { id:'weekend', nameKey:'challenges.items.weekend.name', descKey:'challenges.items.weekend.desc', icon:'🌿', days:2, reward:'🥈' },
  { id:'cook5', nameKey:'challenges.items.cook5.name', descKey:'challenges.items.cook5.desc', icon:'🍳', days:5, reward:'🥗' },
  { id:'save10', nameKey:'challenges.items.save10.name', descKey:'challenges.items.save10.desc', icon:'💰', days:30, reward:'🏆' },
  { id:'budget30', nameKey:'challenges.items.budget30.name', descKey:'challenges.items.budget30.desc', icon:'📊', days:30, reward:'🌟' },
];

export default function ChallengesScreen({ navigation }) {
  const { state, dispatch } = useAppState();
  const { t } = useTranslation();

  const streak = state.streak || { current: 0 };
  const activeChallenge = state.activeChallenge
    ? CHALLENGES.find(c => c.id === state.activeChallenge)
    : null;

  const startDate = state.challengeStartDate
    ? new Date(state.challengeStartDate)
    : null;

  const daysIn = startDate
    ? Math.floor((new Date() - startDate) / (1000 * 60 * 60 * 24))
    : 0;

  const daysLeft = activeChallenge
    ? Math.max(0, activeChallenge.days - daysIn)
    : 0;

  const progress = activeChallenge
    ? Math.min(100, Math.round((daysIn / activeChallenge.days) * 100))
    : 0;

  const startChallenge = (id) => {
    dispatch({
      type: 'START_CHALLENGE',
      payload: { id, date: new Date().toISOString().slice(0, 10) }
    });
  };

  const abandonChallenge = () => {
    Alert.alert(
  t('challenges.abandonTitle'),
  t('challenges.abandonMessage'),
  [
    { text: t('common.cancel'), style: 'cancel' },
    {
      text: t('challenges.abandon'),
          style: 'destructive',
          onPress: () => dispatch({ type: 'END_CHALLENGE' })
        }
      ]
    );
  };

  return (
    <SafeAreaView style={s.container} edges={['top']}>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>

        <Text style={s.title}>{t('challenges.title')}</Text>
        <Text style={s.sub}>{t('challenges.subtitle')}</Text>

        {streak.current >= 1 ? (
          <View style={s.streakBanner}>
            <Text style={s.streakFire}>🔥</Text>
            <View>
              <Text style={s.streakLabel}>{t('challenges.streak.current')}</Text>

              <Text style={s.streakNum}>
                {streak.current}{' '}
                <Text style={s.streakUnit}>{t('challenges.streak.unit')}</Text>
              </Text>

              <Text style={s.streakTip}>{t('challenges.streak.tip')}</Text>
            </View>
          </View>
        ) : (
          <TipBox>{t('challenges.streak.firstTip')}</TipBox>
        )}

        {activeChallenge && (
          <>
            <SectionTitle>{t('challenges.activeTitle')}</SectionTitle>

            <Card style={s.activeCard}>
              <View style={s.challengeHeader}>
                <Text style={{ fontSize: 32 }}>{activeChallenge.icon}</Text>

                <View style={{ flex: 1 }}>
                  <Text style={s.challengeName}>{t(activeChallenge.nameKey)}</Text>
                  <Text style={s.challengeDesc}>{t(activeChallenge.descKey)}</Text>
                </View>

                <View style={{ alignItems: 'center' }}>
                  <Text style={s.daysLeft}>{daysLeft}</Text>
                  <Text style={s.daysLeftLabel}>{t('challenges.daysLeft')}</Text>
                </View>
              </View>

              <View style={s.progressWrap}>
                <View style={[s.progressBar, { width: `${progress}%` }]} />
              </View>

              <View style={{ flexDirection:'row', justifyContent:'space-between', marginTop:6 }}>
                <Text style={s.progressLabel}>
                  {t('challenges.dayProgress', { daysIn, total: activeChallenge.days})}
                </Text>
                <Text style={s.progressLabel}>
                  {t('challenges.reward', { reward: activeChallenge.reward})}
                </Text>
              </View>

              {daysLeft === 0 ? (
                <View style={s.completeBox}>
                  <Text style={{ fontSize: 32 }}>🎉</Text>
                  <Text style={s.completeText}>
                    {t('challenges.completed', { reward: activeChallenge.reward})}
                  </Text>

                  <Button
                    label={t('challenges.startNew')}
                    variant="secondary"
                    style={{ marginTop: 10 }}
                    onPress={() => dispatch({ type:'END_CHALLENGE' })}
                  />
                </View>
              ) : (
                <Button
                  label={t('challenges.abandon')}
                  variant="danger"
                  size="sm"
                  style={{ marginTop:10, alignSelf:'flex-start' }}
                  onPress={abandonChallenge}
                />
              )}
            </Card>
          </>
        )}

        <SectionTitle>
          {activeChallenge
            ? t('challenges.lockedTitle')
            : t('challenges.availableTitle')}
        </SectionTitle>

        {CHALLENGES.filter(c => c.id !== state.activeChallenge).map(c => (
          <Card key={c.id} style={s.challengeCard}>
            <View style={s.challengeHeader}>
              <View style={s.challengeIconBox}>
                <Text style={{ fontSize: 24 }}>{c.icon}</Text>
              </View>

              <View style={{ flex: 1 }}>
                <Text style={s.challengeName}>
                  {t(c.nameKey)}
                </Text>
                <Text style={s.challengeDesc}>
                  {t(c.descKey)}
                </Text>
                <Text style={s.challengeMeta}>
                  {t('challenges.meta', { days: c.days, reward: c.reward })}
                </Text>
              </View>

              {!activeChallenge ? (
                <Button
                  label={t('common.start')}
                  variant="primary"
                  size="sm"
                  onPress={() => startChallenge(c.id)}
                />
              ) : (
                <Text style={{ fontSize:16 }}>🔒</Text>
              )}
            </View>
          </Card>
        ))}

      </ScrollView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex:1, backgroundColor:colors.bg },
  scroll: { padding:spacing.xl, paddingBottom:40 },
  title: { fontSize:22, fontWeight:'700', color:colors.text, marginBottom:4 },
  sub: { fontSize:13, color:colors.muted, marginBottom:20, lineHeight:20 },
  streakBanner: { backgroundColor:'rgba(124,106,247,0.12)', borderWidth:1, borderColor:'rgba(124,106,247,0.25)', borderRadius:radius.md, padding:16, marginBottom:16, flexDirection:'row', alignItems:'center', gap:14 },
  streakFire: { fontSize:36 },
  streakLabel: { fontSize:12, color:colors.muted },
  streakNum: { fontSize:24, fontWeight:'800', color:colors.accent },
  streakUnit: { fontSize:14, fontWeight:'400', color:colors.muted },
  streakTip: { fontSize:11, color:colors.muted, marginTop:2 },
  activeCard: { borderColor:colors.accent },
  challengeCard: { marginBottom:10 },
  challengeHeader: { flexDirection:'row', alignItems:'center', gap:12 },
  challengeIconBox: { width:44, height:44, borderRadius:10, backgroundColor:colors.surface2, alignItems:'center', justifyContent:'center', flexShrink:0 },
  challengeName: { fontSize:14, fontWeight:'600', color:colors.text },
  challengeDesc: { fontSize:12, color:colors.muted, marginTop:2 },
  challengeMeta: { fontSize:11, color:colors.accent, marginTop:4 },
  daysLeft: { fontSize:22, fontWeight:'700', color:colors.accent },
  daysLeftLabel: { fontSize:10, color:colors.muted },
  progressWrap: { backgroundColor:colors.surface2, borderRadius:100, height:10, overflow:'hidden', marginTop:12 },
  progressBar: { height:'100%', borderRadius:100, backgroundColor:colors.accent },
  progressLabel: { fontSize:11, color:colors.muted },
  completeBox: { backgroundColor:'rgba(72,187,120,0.1)', borderWidth:1, borderColor:'rgba(72,187,120,0.3)', borderRadius:10, padding:12, marginTop:12, alignItems:'center' },
  completeText: { fontSize:13, fontWeight:'600', color:colors.success, marginTop:6, textAlign:'center' },
});