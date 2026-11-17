import type { PropsWithChildren } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View, type TextProps, type ViewProps } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { palette as c, radius, space } from '@/constants/design';

export function Copy({ style, ...props }: TextProps) {
  return <Text {...props} style={[ui.body, style]} />;
}
export function Screen({ children }: PropsWithChildren) {
  return <SafeAreaView style={ui.screen} edges={['top', 'left', 'right']}>
    <ScrollView contentContainerStyle={ui.content}>{children}</ScrollView>
  </SafeAreaView>;
}
export function Card({ style, ...props }: ViewProps) {
  return <View {...props} style={[ui.card, style]} />;
}
export function Button({ label, onPress, secondary = false }: { label: string; onPress: () => void; secondary?: boolean }) {
  return <Pressable accessibilityRole="button" onPress={onPress}
    style={({ pressed }) => [ui.button, secondary && ui.secondary, pressed && { opacity: 0.75 }]}>
    <Copy style={[ui.buttonLabel, secondary && { color: c.green }]}>{label}</Copy>
  </Pressable>;
}
export function Progress({ value, label, inverted = false }: { value: number; label: string; inverted?: boolean }) {
  const percent = Math.round(Math.min(1, Math.max(0, value)) * 100);
  return <View accessibilityRole="progressbar" accessibilityLabel={label}
    accessibilityValue={{ min: 0, max: 100, now: percent }}
    style={[ui.track, inverted && { backgroundColor: '#3F7055' }]}>
    <View style={[ui.fill, { width: `${percent}%` }, inverted && { backgroundColor: c.lime }]} />
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
      <Copy style={{ fontSize: 44, color: c.green }}>{symbol}</Copy>
      <Copy style={ui.heading}>A new chapter is coming</Copy>
      <Copy style={{ color: c.muted, textAlign: 'center' }}>{description}</Copy>
      <Copy style={ui.badge}>Coming in a future phase</Copy>
    </Card></Screen>;
}
export const ui = StyleSheet.create({
  screen: { flex: 1, backgroundColor: c.background },
  content: { padding: space.lg, gap: space.lg, maxWidth: 620, width: '100%', alignSelf: 'center', paddingBottom: 32 },
  body: { color: c.ink, fontSize: 15, lineHeight: 22 },
  title: { fontSize: 32, lineHeight: 39, fontWeight: '700', letterSpacing: -1 },
  heading: { fontSize: 19, lineHeight: 26, fontWeight: '700', letterSpacing: -0.3 },
  eyebrow: { fontSize: 11, fontWeight: '700', letterSpacing: 1.6, color: c.green },
  muted: { color: c.muted },
  card: { backgroundColor: c.surface, borderRadius: radius.card, padding: space.lg, borderWidth: 1, borderColor: c.line, gap: space.md },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  button: { backgroundColor: c.green, borderRadius: radius.control, minHeight: 54, padding: 16, alignItems: 'center', justifyContent: 'center' },
  secondary: { backgroundColor: c.mint }, buttonLabel: { color: c.surface, fontWeight: '700', fontSize: 16 },
  track: { height: 8, borderRadius: 4, backgroundColor: c.mint, overflow: 'hidden' },
  fill: { height: '100%', borderRadius: 4, backgroundColor: c.green },
  badge: { color: c.green, backgroundColor: c.mint, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 6, fontSize: 12, fontWeight: '600' },
  cover: { width: 96, minHeight: 142, backgroundColor: '#EDE5D4', borderRadius: 6, borderLeftWidth: 5, borderLeftColor: '#D1C6AF', padding: 10, justifyContent: 'space-between', gap: 10 },
  coverSmall: { fontSize: 7, lineHeight: 10, letterSpacing: 0.5, color: '#665E4D', fontWeight: '600' },
  coverTitle: { fontSize: 17, lineHeight: 20, fontWeight: '900', color: '#8B6839' },
  coverRule: { height: 1, backgroundColor: '#C0AF8F' },
});
