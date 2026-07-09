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
    RecurringScreen.js   
    GoalsScreen.js       
    SplitScreen.js       
    ChallengesScreen.js  
    ReportScreen.js      
    SubscriptionsScreen.js 
```

## Publishing

```bash
npm install -g eas-cli
eas login
eas build --platform all
eas submit --platform all
```
