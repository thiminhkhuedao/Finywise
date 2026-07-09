# FinyWise — React Native Mobile App

> Smart personal finance for students and young workers.

## Getting started

```bash
npm install
npx expo start
```

Scan the QR code with Expo Go on your phone.

## Project structure

```
src/
  state.js              — Global state + AsyncStorage
  theme.js              — Colors, spacing, radius
  components/UI.js      — Shared UI components
  screens/
    OnboardingScreen.js
    DashboardScreen.js
    BudgetScreen.js
    DecideScreen.js
    ActivitiesScreen.js
    InsightsScreen.js
    MoreScreen.js
    RecurringScreen.js   — NEW: Recurring expenses
    GoalsScreen.js       — NEW: Savings goals
    SplitScreen.js       — NEW: Bill split
    ChallengesScreen.js  — NEW: Streaks & challenges
    ReportScreen.js      — NEW: Monthly report
    SubscriptionsScreen.js — NEW: Subscription manager
```

## Publishing

```bash
npm install -g eas-cli
eas login
eas build --platform all
eas submit --platform all
```
