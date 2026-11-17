import { useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { Link } from 'expo-router';
import { BookCover, Button, Card, Copy, Progress, Screen, ui } from '@/components/reading-ui';
import { palette as c } from '@/constants/design';
import { dashboard as data } from '@/data/dashboard';

export default function HomeScreen() {
  const [showLogPreview, setShowLogPreview] = useState(false);
  const remaining = data.dailyTarget - data.dailyPages;
  return <Screen>
    <View style={ui.row}>
      <View><Copy style={ui.eyebrow}>READING ACCOUNTABILITY</Copy><Copy style={s.greeting}>Your next chapter awaits.</Copy></View>
      <Link href="/profile" accessibilityLabel="Open profile" style={s.avatar}>R</Link>
    </View>
    <View style={{ gap: 6 }}><Copy style={ui.title}>Small pages.{'\n'}Big possibilities.</Copy>
      <Copy style={ui.muted}>Make a little room for reading today.</Copy></View>
    <View style={s.stats}>
      {[{ value: data.streak, label: 'day streak', mark: '↗' }, { value: data.weeklyPages, label: 'pages this week', mark: '▤' }, { value: data.finishedBooks, label: 'books finished', mark: '✓' }].map(stat =>
        <View key={stat.label} style={s.stat}><Copy style={s.statMark}>{stat.mark}</Copy><Copy style={s.statNumber}>{stat.value}</Copy><Copy style={s.statLabel}>{stat.label}</Copy></View>)}
    </View>
    <Card style={s.goal}>
      <View style={ui.row}><Copy style={s.goalEyebrow}>YOUR DAILY GOAL</Copy><Copy style={s.goalBadge}>Keep growing</Copy></View>
      <View style={s.goalNumbers}><Copy style={s.goalNumber}>{data.dailyPages}</Copy><Copy style={s.goalTotal}>/ {data.dailyTarget} pages</Copy></View>
      <Progress value={data.dailyPages / data.dailyTarget} label="Daily reading goal" inverted />
      <Copy style={s.goalCaption}>Just {remaining} more pages. You’ve got this.</Copy>
    </Card>
    <View style={ui.row}><Copy style={ui.heading}>Continue reading</Copy><Link href="/library" style={s.textLink}>My library →</Link></View>
    <Card>
      <View style={[ui.row, { alignItems: 'flex-start' }]}><BookCover />
        <View style={s.bookInfo}><Copy style={ui.badge}>Currently reading</Copy><Copy style={ui.heading}>{data.book.title}</Copy><Copy style={ui.muted}>{data.book.author}</Copy>
          <Progress value={data.book.page / data.book.totalPages} label="Current book progress" />
          <Copy style={s.bookPages}>{data.book.page} of {data.book.totalPages} pages · {Math.round(data.book.page / data.book.totalPages * 100)}%</Copy>
        </View>
      </View>
      <Button label="＋  Log Reading" onPress={() => setShowLogPreview(true)} />
    </Card>
    <Card>
      <View style={ui.row}><Copy style={ui.heading}>One day at a time</Copy><Copy style={ui.badge}>7-day streak</Copy></View>
      <Copy style={ui.muted}>A few pages a day go a long way.</Copy>
      <View style={s.week}>{['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) =>
        <View key={index} accessible accessibilityLabel={`${['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'][index]}: ${data.week[index] ? 'goal met' : 'in progress'}`} style={s.day}>
          <View style={[s.dayCircle, data.week[index] && s.dayDone]}><Copy style={{ color: data.week[index] ? c.surface : c.green }}>{data.week[index] ? '✓' : '•'}</Copy></View><Copy style={s.statLabel}>{day}</Copy>
        </View>)}</View>
    </Card>
    <Copy style={s.footer}>YOUR READING JOURNEY, ONE PAGE AT A TIME</Copy>
    <Copy style={s.demo}>Phase 1 preview · Sample data · Available offline</Copy>
    <Modal visible={showLogPreview} transparent animationType="fade" onRequestClose={() => setShowLogPreview(false)}>
      <View style={s.scrim}><Card style={s.modal}>
        <Copy style={ui.eyebrow}>LOG READING · PREVIEW</Copy><Copy style={ui.heading}>Every page counts.</Copy>
        <Copy style={ui.muted}>You’re reading {data.book.title}, currently on page {data.book.page}. Recording reading sessions will arrive in a future phase. This preview does not save progress.</Copy>
        <Button label="Back to my dashboard" onPress={() => setShowLogPreview(false)} />
      </Card></View>
    </Modal>
  </Screen>;
}
const s = StyleSheet.create({
  greeting: { fontSize: 12, color: c.muted, marginTop: 4 },
  avatar: { backgroundColor: c.mint, color: c.green, textAlign: 'center', fontWeight: '700', fontSize: 18, padding: 12, borderRadius: 24, overflow: 'hidden', minWidth: 48, minHeight: 48 },
  stats: { flexDirection: 'row', gap: 8 },
  stat: { flex: 1, backgroundColor: c.surface, borderWidth: 1, borderColor: c.line, borderRadius: 20, paddingVertical: 16, paddingHorizontal: 8, alignItems: 'center', gap: 4 },
  statMark: { color: c.green, fontSize: 20 }, statNumber: { fontSize: 27, lineHeight: 32, fontWeight: '700' },
  statLabel: { fontSize: 11, lineHeight: 16, color: c.muted, textAlign: 'center' },
  goal: { backgroundColor: c.greenDark, borderColor: c.greenDark },
  goalEyebrow: { color: c.lime, fontSize: 11, letterSpacing: 1.5, fontWeight: '700', flexShrink: 1 },
  goalBadge: { color: c.lime, fontSize: 11, backgroundColor: '#2E6046', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12 },
  goalNumbers: { flexDirection: 'row', alignItems: 'baseline', gap: 8 },
  goalNumber: { fontSize: 48, lineHeight: 56, fontWeight: '700', color: c.surface },
  goalTotal: { color: '#C3D8C7', fontSize: 17 }, goalCaption: { color: '#D6E5D9', fontSize: 13 },
  textLink: { color: c.green, fontSize: 13, fontWeight: '600', paddingVertical: 12 },
  bookInfo: { flex: 1, alignItems: 'stretch', gap: 9 }, bookPages: { fontSize: 11, color: c.muted },
  week: { flexDirection: 'row', justifyContent: 'space-between', gap: 4 }, day: { flex: 1, alignItems: 'center', gap: 8 },
  dayCircle: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center', backgroundColor: c.mint }, dayDone: { backgroundColor: c.green },
  footer: { textAlign: 'center', fontSize: 9, letterSpacing: 1.2, color: c.muted }, demo: { textAlign: 'center', fontSize: 11, color: c.muted, marginTop: -16 },
  scrim: { flex: 1, backgroundColor: '#10271CB3', justifyContent: 'center', padding: 24 }, modal: { width: '100%', maxWidth: 460, alignSelf: 'center' },
});
