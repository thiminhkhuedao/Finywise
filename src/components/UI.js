import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, TextInput as RNInput } from 'react-native';
import { colors, spacing, radius } from '../theme';

export function Card({ children, style }) {
  return <View style={[s.card, style]}>{children}</View>;
}

export function SectionTitle({ children, style }) {
  return <Text style={[s.sectionTitle, style]}>{children}</Text>;
}

export function Button({ label, onPress, variant = 'primary', size = 'md', style, disabled }) {
  const variants = {
    primary:   { bg: colors.accent,   text: '#fff' },
    secondary: { bg: colors.surface2, text: colors.text },
    danger:    { bg: 'rgba(245,101,101,0.12)', text: colors.danger },
    success:   { bg: 'rgba(72,187,120,0.12)',  text: colors.success },
  };
  const v = variants[variant] || variants.primary;
  const pad = size === 'sm' ? { paddingVertical: 6, paddingHorizontal: 12 } : { paddingVertical: 11, paddingHorizontal: 16 };
  const fontSize = size === 'sm' ? 12 : 14;
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[s.btn, { backgroundColor: v.bg }, pad, style, disabled && { opacity: 0.5 }]}
      activeOpacity={0.75}>
      <Text style={[s.btnText, { color: v.text, fontSize }]}>{label}</Text>
    </TouchableOpacity>
  );
}

export function Input({ label, ...props }) {
  return (
    <View style={s.fieldWrap}>
      {label ? <Text style={s.label}>{label}</Text> : null}
      <RNInput
        style={s.input}
        placeholderTextColor={colors.muted}
        {...props}/>
    </View>
  );
}

export function Row({ children, style }) {
  return <View style={[s.row, style]}>{children}</View>;
}

export function Badge({ label, variant = 'default' }) {
  const variants = {
    default: { bg: 'rgba(124,106,247,0.15)', text: colors.accent },
    success: { bg: 'rgba(72,187,120,0.15)',  text: colors.success },
    danger:  { bg: 'rgba(245,101,101,0.15)', text: colors.danger },
    warning: { bg: 'rgba(237,137,54,0.16)',  text: colors.warning },
  };
  const v = variants[variant] || variants.default;
  return (
    <View style={[s.badge, { backgroundColor: v.bg }]}>
      <Text style={[s.badgeText, { color: v.text }]}>{label}</Text>
    </View>
  );
}

export function TipBox({ children }) {
  return (
    <View style={s.tip}>
      <Text style={s.tipText}>{children}</Text>
    </View>
  );
}

export function Empty({ icon, message }) {
  return (
    <View style={s.empty}>
      <Text style={s.emptyIcon}>{icon}</Text>
      <Text style={s.emptyText}>{message}</Text>
    </View>
  );
}

export function Sheet({ visible, onClose, title, children }) {
  const Modal = require('react-native').Modal;
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <TouchableOpacity style={s.overlay} activeOpacity={1} onPress={onClose}>
        <TouchableOpacity activeOpacity={1} style={s.sheet}>
          <View style={s.handle}/>
          {title ? <Text style={s.sheetTitle}>{title}</Text> : null}
          {children}
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const s = StyleSheet.create({
  card:         { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.lg, marginBottom: 14 },
  sectionTitle: { fontSize: 11, fontWeight: '600', color: colors.muted, textTransform: 'uppercase', letterSpacing: 1.2, marginBottom: 12, marginTop: 4 },
  btn:          { borderRadius: radius.sm, alignItems: 'center', justifyContent: 'center' },
  btnText:      { fontWeight: '500' },
  fieldWrap:    { marginBottom: 12 },
  label:        { fontSize: 12, color: colors.muted, marginBottom: 4 },
  input:        { backgroundColor: colors.surface2, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, color: colors.text, fontSize: 14, padding: 10 },
  row:          { flexDirection: 'row', alignItems: 'center' },
  badge:        { paddingHorizontal: 9, paddingVertical: 3, borderRadius: 20, alignSelf: 'flex-start' },
  badgeText:    { fontSize: 11, fontWeight: '500' },
  tip:          { backgroundColor: 'rgba(124,106,247,0.07)', borderWidth: 1, borderColor: 'rgba(124,106,247,0.22)', borderRadius: radius.sm, padding: 11, marginTop: 10 },
  tipText:      { fontSize: 12, color: colors.muted, lineHeight: 18 },
  empty:        { alignItems: 'center', padding: 36 },
  emptyIcon:    { fontSize: 36, marginBottom: 10 },
  emptyText:    { fontSize: 13, color: colors.muted, textAlign: 'center', lineHeight: 20 },
  overlay:      { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.6)' },
  sheet:        { backgroundColor: colors.surface, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 24, paddingBottom: 40 },
  handle:       { width: 36, height: 4, backgroundColor: colors.border, borderRadius: 2, alignSelf: 'center', marginBottom: 16 },
  sheetTitle:   { fontSize: 17, fontWeight: '700', color: colors.text, marginBottom: 16 },
});
