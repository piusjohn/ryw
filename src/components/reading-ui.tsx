import type { PropsWithChildren } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type TextProps, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { palette as c, radius, space } from '@/constants/design';

export function Copy({ style, ...props }: TextProps) {
  return <Text {...props} style={[ui.body, style]} />;
}
export function Screen({ children }: PropsWithChildren) {
  return <SafeAreaView style={ui.screen} edges={['top', 'left', 'right']}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={ui.content}>{children}</ScrollView>
  </SafeAreaView>;
}
export function Card({ style, ...props }: ViewProps) {
  return <View {...props} style={[ui.card, style]} />;
}
export function Button({ label, onPress, secondary = false, disabled = false }: { label: string; onPress: () => void; secondary?: boolean; disabled?: boolean }) {
  return <Pressable accessibilityRole="button" accessibilityState={{ disabled }} disabled={disabled} onPress={onPress}
    style={({ pressed }) => [ui.button, secondary && ui.secondary, pressed && !disabled && { transform: [{ translateY: 3 }], borderBottomWidth: 1 }, disabled && { opacity: 0.5 }]}>
    <Copy style={[ui.buttonLabel, secondary && { color: c.accent }]}>{label}</Copy>
  </Pressable>;
}
export function Progress({ value, label, inverted = false }: { value: number; label: string; inverted?: boolean }) {
  const percent = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return <View accessibilityRole="progressbar" accessibilityLabel={label}
    accessibilityValue={{ min: 0, max: 100, now: percent }}
    style={[ui.track, inverted && { backgroundColor: c.lemonTrack }]}>
    <View style={[ui.fill, { width: `${percent}%` }, inverted && { backgroundColor: c.accent }]} />
  </View>;
}
export function BookCover() {
  return <View accessible accessibilityLabel="Atomic Habits book cover illustration" style={ui.cover}>
    <Copy style={ui.coverSmall}>JAMES CLEAR</Copy>
    <View style={ui.coverRule} />
    <Copy style={ui.coverTitle}>ATOMIC{'\n'}HABITS</Copy>
    <Copy style={ui.coverSmall}>TINY CHANGES,{'\n'}REMARKABLE RESULTS</Copy>
  </View>;
}
export function Placeholder({ title, symbol, description }: { title: string; symbol: string; description: string }) {
  return <Screen><Copy style={ui.eyebrow}>READING ACCOUNTABILITY</Copy><Copy style={ui.title}>{title}</Copy>
    <Card style={{ alignItems: 'center', paddingVertical: 48, gap: 16 }}>
      <Copy style={{ fontSize: 44, color: c.accent }}>{symbol}</Copy>
      <Copy style={ui.heading}>A new chapter is coming</Copy>
      <Copy style={{ color: c.muted, textAlign: 'center' }}>{description}</Copy>
      <Copy style={ui.badge}>Coming in a future phase</Copy>
    </Card></Screen>;
}
export const ui = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.background },
  content: { padding: space.lg, gap: space.lg, maxWidth: 620, width: '100%', alignSelf: 'center', paddingBottom: 32 },
  body: { color: c.ink, fontSize: 15, lineHeight: 22 },
  title: { fontSize: 34, lineHeight: 41, fontWeight: '700', letterSpacing: -1 },
  heading: { fontSize: 19, lineHeight: 26, fontWeight: '700', letterSpacing: -0.3 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.6, color: c.accent },
  muted: { color: c.muted },
  card: { backgroundColor: c.surface, borderRadius: radius.card, padding: 20, borderWidth: 2, borderBottomWidth: 4, borderColor: c.line, gap: space.md },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  button: { backgroundColor: c.lemon, borderRadius: radius.control, borderBottomWidth: 4, borderBottomColor: '#45A500', minHeight: 56, padding: 14, alignItems: 'center', justifyContent: 'center' },
  secondary: { backgroundColor: c.surface, borderWidth: 2, borderBottomWidth: 4, borderColor: c.line }, buttonLabel: { color: c.ink, fontWeight: '700', fontSize: 16 },
  track: { height: 14, borderRadius: 7, backgroundColor: c.line, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 7, backgroundColor: c.lemon },
  badge: { color: c.accent, backgroundColor: c.softGreen, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, fontSize: 12, fontWeight: '600' },
  cover: { width: 96, minHeight: 142, backgroundColor: c.softGreen, borderRadius: 6, borderLeftWidth: 5, borderLeftColor: c.lemon, padding: 10, justifyContent: 'space-between', gap: 10 },
  coverSmall: { fontSize: 7, lineHeight: 10, letterSpacing: 0.5, color: c.muted, fontWeight: '600' },
  coverTitle: { fontSize: 17, lineHeight: 20, fontWeight: '900', color: c.accent },
  coverRule: { height: 1, backgroundColor: c.line },
});
