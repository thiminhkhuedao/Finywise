import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, } from 'react-native';
import { SafeAreaProvider, SafeAreaView, } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';

import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createStackNavigator } from '@react-navigation/stack';

import { StateProvider, useAppState } from './src/state';
import { colors } from './src/theme';
import { useEffect } from 'react';
import { I18nextProvider } from 'react-i18next';
import i18n from './src/i18n';

// Screens (TABS)
import DashboardScreen from './src/screens/DashboardScreen';
import BudgetScreen from './src/screens/BudgetScreen';
import GoalsScreen from './src/screens/GoalsScreen';
import DecideScreen from './src/screens/DecideScreen';
import SubscriptionsScreen from './src/screens/SubscriptionsScreen';
import MoreScreen from './src/screens/MoreScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';

// Screens (STACK inside More)
import ActivitiesScreen from './src/screens/ActivitiesScreen';
import RecurringScreen from './src/screens/RecurringScreen';
import SplitScreen from './src/screens/SplitScreen';
import ChallengesScreen from './src/screens/ChallengesScreen';
import ReportScreen from './src/screens/ReportScreen';
import InsightsScreen from './src/screens/InsightsScreen';
import SettingsScreen from './src/screens/SettingsScreen';

const Tab = createBottomTabNavigator();
const Stack = createStackNavigator();
const TAB_ICONS = {
  Dashboard: '⊞',
  Budget: '◎',
  Goals: '🎯',
  Decide: '✦',
  Subs: '💳',
  More: '⋯',
};

function CustomTabBar({ state, navigation }) {
  return (
    <SafeAreaView
  edges={['bottom']}
  style={[
    s.tabBar,
    {
      backgroundColor: colors.bg,
    },
  ]}
>
      {state.routes.map((route, i) => {
        const focused = state.index === i;

        return (
          <TouchableOpacity
            key={route.key}
            style={s.tabBtn}
            activeOpacity={0.7}
            onPress={() => navigation.navigate(route.name)}
          >
            <Text style={[s.tabIcon, focused && s.tabIconActive]}>
              {TAB_ICONS[route.name]}
            </Text>

            <Text style={[s.tabLabel, focused && s.tabLabelActive]}>
              {route.name}
            </Text>
          </TouchableOpacity>
        );
      })}
    </SafeAreaView>
  );
}

function MoreStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MoreHome" component={MoreScreen} />
      <Stack.Screen name="Activities" component={ActivitiesScreen} />
      <Stack.Screen name="Recurring" component={RecurringScreen} />
      <Stack.Screen name="Split" component={SplitScreen} />
      <Stack.Screen name="Challenges" component={ChallengesScreen} />
      <Stack.Screen name="Report" component={ReportScreen} />
      <Stack.Screen name="Insights" component={InsightsScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
    </Stack.Navigator>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator
  tabBar={(props) => <CustomTabBar {...props} />}
  screenOptions={{ headerShown: false }}
>
      <Tab.Screen name="Dashboard" component={DashboardScreen} />
      <Tab.Screen name="Budget" component={BudgetScreen} />
      <Tab.Screen name="Goals" component={GoalsScreen} />
      <Tab.Screen name="Decide" component={DecideScreen} />
      <Tab.Screen name="Subs" component={SubscriptionsScreen} />
      <Tab.Screen name="More" component={MoreStack} />
    </Tab.Navigator>
  );
}

function Loading() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Loading...</Text>
    </View>
  );
}

function RootNavigator() {

  const { state } = useAppState();

useEffect(() => {
  i18n.changeLanguage(state?.profile?.language || 'en');
}, [state?.profile?.language]);

  if (!state.loaded) {
    return <Loading />;
  }

  if (!state.profile.name) {
    return (
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen
            name="Onboarding"
            component={OnboardingScreen}
          />
        </Stack.Navigator>
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer>
      <MainTabs />
    </NavigationContainer>
  );
}

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" backgroundColor={colors.bg} />

        <StateProvider>
          <View style={{ flex: 1, backgroundColor: colors.bg }}>
            <RootNavigator />
          </View>
        </StateProvider>

      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const s = StyleSheet.create({
  tabBar: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 8,
    paddingBottom: 10,
    minHeight: 70,
  },

  tabBtn: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },

  tabIcon: {
    fontSize: 20,
    color: colors.muted,
  },

  tabIconActive: {
    color: colors.accent,
  },

  tabLabel: {
    fontSize: 10,
    color: colors.muted,
    marginTop: 2,
  },

  tabLabelActive: {
    color: colors.accent,
    fontWeight: '600',
  },
});