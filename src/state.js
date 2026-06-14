import React, { createContext, useContext, useReducer, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'finywise_state_v1';

const initialState = {
  loaded: false,
  profile: { name: '', currency: '€', monthlyIncome: 0, savingsGoal: 20 },
  budgets: [],
  transactions: [],
  activities: [],
  priceWatchlist: [],
  recurringExpenses: [],
  savingsGoals: [],
  subscriptions: [],
  streak: { current: 0, lastDate: '' },
  activeChallenge: null,
  challengeStartDate: null,
};

function reducer(state, action) {
  switch (action.type) {
    case 'LOAD':           return { ...action.payload, loaded: true };
    case 'RESET':          return { ...initialState, loaded: true };
    case 'SET_PROFILE':    return { ...state, profile: { ...state.profile, ...action.payload } };
    case 'ADD_BUDGET':     return { ...state, budgets: [...state.budgets, action.payload] };
    case 'UPDATE_BUDGET':  return { ...state, budgets: state.budgets.map(b => b.id === action.payload.id ? { ...b, ...action.payload } : b) };
    case 'DELETE_BUDGET':  return { ...state, budgets: state.budgets.filter(b => b.id !== action.payload) };
    case 'ADD_TRANSACTION':
      const t = action.payload;
      return {
        ...state,
        transactions: [...state.transactions, t],
        budgets: t.type === 'expense' && t.categoryId
          ? state.budgets.map(b => b.id === t.categoryId ? { ...b, spent: b.spent + t.amount } : b)
          : state.budgets,
      };
    case 'DELETE_TRANSACTION':
      const tx = state.transactions.find(x => x.id === action.payload);
      return {
        ...state,
        transactions: state.transactions.filter(x => x.id !== action.payload),
        budgets: tx && tx.type === 'expense' && tx.categoryId
          ? state.budgets.map(b => b.id === tx.categoryId ? { ...b, spent: Math.max(0, b.spent - tx.amount) } : b)
          : state.budgets,
      };
    case 'ADD_ACTIVITY':      return { ...state, activities: [...state.activities, action.payload] };
    case 'UPDATE_ACTIVITY':   return { ...state, activities: state.activities.map(a => a.id === action.payload.id ? { ...a, ...action.payload } : a) };
    case 'DELETE_ACTIVITY':   return { ...state, activities: state.activities.filter(a => a.id !== action.payload) };
    case 'ADD_PRICE_WATCH':   return { ...state, priceWatchlist: [...state.priceWatchlist, action.payload] };
    case 'DELETE_PRICE_WATCH':return { ...state, priceWatchlist: state.priceWatchlist.filter(p => p.id !== action.payload) };
    case 'ADD_RECURRING':     return { ...state, recurringExpenses: [...state.recurringExpenses, action.payload] };
    case 'UPDATE_RECURRING':  return { ...state, recurringExpenses: state.recurringExpenses.map(r => r.id === action.payload.id ? { ...r, ...action.payload } : r) };
    case 'DELETE_RECURRING':  return { ...state, recurringExpenses: state.recurringExpenses.filter(r => r.id !== action.payload) };
    case 'ADD_GOAL':          return { ...state, savingsGoals: [...state.savingsGoals, action.payload] };
    case 'UPDATE_GOAL':       return { ...state, savingsGoals: state.savingsGoals.map(g => g.id === action.payload.id ? { ...g, ...action.payload } : g) };
    case 'DELETE_GOAL':       return { ...state, savingsGoals: state.savingsGoals.filter(g => g.id !== action.payload) };
    case 'ADD_TO_GOAL':       return { ...state, savingsGoals: state.savingsGoals.map(g => g.id === action.payload.id ? { ...g, saved: Math.min(g.target, g.saved + action.payload.amount), completed: (g.saved + action.payload.amount) >= g.target } : g) };
    case 'ADD_SUB':           return { ...state, subscriptions: [...state.subscriptions, action.payload] };
    case 'UPDATE_SUB':        return { ...state, subscriptions: state.subscriptions.map(s => s.id === action.payload.id ? { ...s, ...action.payload } : s) };
    case 'SET_SUB_STATUS':    return { ...state, subscriptions: state.subscriptions.map(s => s.id === action.payload.id ? { ...s, status: action.payload.status } : s) };
    case 'SET_SUB_USAGE':     return { ...state, subscriptions: state.subscriptions.map(s => s.id === action.payload.id ? { ...s, usageLevel: action.payload.level, status: ['never','rarely'].includes(action.payload.level) ? 'cancel' : ['daily','weekly'].includes(action.payload.level) ? 'keep' : s.status } : s) };
    case 'DELETE_SUB':        return { ...state, subscriptions: state.subscriptions.filter(s => s.id !== action.payload) };
    case 'START_CHALLENGE':   return { ...state, activeChallenge: action.payload.id, challengeStartDate: action.payload.date };
    case 'END_CHALLENGE':     return { ...state, activeChallenge: null, challengeStartDate: null };
    case 'UPDATE_STREAK':     return { ...state, streak: action.payload };
    default: return state;
  }
}

const StateContext = createContext(null);

export function StateProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY).then(data => {
      if (data) {
        try { dispatch({ type: 'LOAD', payload: JSON.parse(data) }); }
        catch { dispatch({ type: 'LOAD', payload: initialState }); }
      } else {
        dispatch({ type: 'LOAD', payload: initialState });
      }
    });
  }, []);

  useEffect(() => {
    if (!state.loaded) return;
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state)).catch(() => {});
  }, [state]);

  return (
    <StateContext.Provider value={{ state, dispatch }}>
      {children}
    </StateContext.Provider>
  );
}

export function useAppState() {
  return useContext(StateContext);
}

export function useComputed() {
  const { state } = useAppState();
  const { budgets, profile } = state;
  const totalSpent = budgets.reduce((s, b) => s + b.spent, 0);
  const totalAllocated = budgets.reduce((s, b) => s + b.allocated, 0);
  const income = profile.monthlyIncome || 0;
  const availableBalance = income - totalSpent;
  const savingsAmount = Math.max(0, income - totalAllocated);
  const healthScore = (() => {
    if (!income) return 50;
    const r = totalSpent / income, sr = savingsAmount / income;
    let sc = 100;
    if (r > 0.9) sc -= 40; else if (r > 0.7) sc -= 20; else if (r > 0.5) sc -= 10;
    if (sr < 0.1) sc -= 20; else if (sr < 0.2) sc -= 10;
    return Math.max(10, Math.min(100, Math.round(sc)));
  })();
  const fmt = (n) => (profile.currency || '€') + Number(n).toFixed(2).replace(/\.00$/, '');
  const pct = (s, t) => !t ? 0 : Math.min(100, Math.round((s / t) * 100));
  return { totalSpent, totalAllocated, income, availableBalance, savingsAmount, healthScore, fmt, pct };
}

export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

export function today() {
  return new Date().toISOString().slice(0, 10);
}
