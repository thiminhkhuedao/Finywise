import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';

import { useAppState } from '../state';
import { colors } from '../theme';

export default function SettingsScreen() {
  const { state, dispatch } = useAppState();

  const setLanguage = (language) => {
    dispatch({
      type: 'SET_PROFILE',
      payload: { language },
    });
  };

  return (
    <View style={s.container}>
      <Text style={s.title}>Language</Text>

      <TouchableOpacity
        style={s.button}
        onPress={() => setLanguage('fr')}
      >
        <Text style={s.text}>
          🇫🇷 Français
          {state.profile.language === 'fr' ? ' ✓' : ''}
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={s.button}
        onPress={() => setLanguage('en')}
      >
        <Text style={s.text}>
          🇬🇧 English
          {state.profile.language === 'en' ? ' ✓' : ''}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    padding: 24,
  },

  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 20,
  },

  button: {
    backgroundColor: colors.surface,
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },

  text: {
    color: colors.text,
    fontSize: 18,
  },
});