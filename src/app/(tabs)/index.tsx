import { View } from 'react-native';
import { Link, router } from 'expo-router';
import { Button, Card, Copy, Progress, Screen, ui } from '@/components/reading-ui';
import { palette as c } from '@/constants/design';
import { useBooks } from '@/features/books/books-provider';
import { Cover } from '@/features/books/book-card';
import { LibraryState } from '@/features/books/library-state';
import { localDate, pages, previousDate, streak, totalForDate } from '@/features/reading/model';
import { useReading } from '@/features/reading/use-reading';
export default function HomeScreen() {
  const { books, loading, error } = useBooks(); const reading = useReading();
  if (loading || error) return <LibraryState />;
  const active = books.filter(book => book.status === 'reading'); const current = active[0]; const today = localDate();
  const todaysGoals = reading.goals.filter(g => g.readingDate === today);
  const dailyGoals = [...todaysGoals, ...active.filter(book => !todaysGoals.some(goal => goal.bookId === book.id)).map(book => ({ bookId: book.id, readingDate: today, target: book.dailyTarget }))];
  const target = dailyGoals.reduce((sum, goal) => sum + goal.target, 0); const todayPages = totalForDate(reading.logs, today);
  const goalMet = dailyGoals.length > 0 && dailyGoals.every(goal => totalForDate(reading.logs, today, goal.bookId) >= goal.target);
  const remaining = dailyGoals.reduce((sum, goal) => sum + Math.max(0, goal.target - totalForDate(reading.logs, today, goal.bookId)), 0);
  let weekStart = today; for (let i = 0; i < 6; i++) weekStart = previousDate(weekStart);
  const weekly = reading.logs.filter(l => l.readingDate >= weekStart && l.readingDate <= today).reduce((sum, l) => sum + pages(l), 0);
  return <Screen>
    <View style={ui.row}><View><Copy style={{ color: c.accent, fontWeight: '900', fontSize: 20 }}>read with you</Copy><Copy style={{ color: c.muted, fontSize: 12 }}>Your reading companion</Copy></View><Link href="/profile" style={ui.badge}>PROFILE</Link></View>
    <View style={{ gap: 6 }}><Copy style={ui.title}>Let’s read today!</Copy><Copy style={ui.muted}>A few pages can take you anywhere.</Copy></View>
    <Card style={{ backgroundColor: c.softGreen, borderColor: '#D5EDBE', gap: 14 }}><View style={ui.row}><View style={{ flex: 1 }}><Copy style={{ color: c.accent, fontWeight: '800', fontSize: 12, letterSpacing: 1 }}>DAILY GOAL</Copy><Copy style={{ fontSize: 28, lineHeight: 36, fontWeight: '800' }}>{todayPages} <Copy style={{ color: c.muted, fontSize: 18 }}> / {target} pages</Copy></Copy></View><View style={{ width: 48, height: 48, borderRadius: 16, backgroundColor: c.lemon, alignItems: 'center', justifyContent: 'center' }}><Copy style={{ fontSize: 25 }}>✦</Copy></View></View><Progress value={target ? todayPages / target : 0} label="Today's reading progress" /><Copy style={{ color: c.accent, fontWeight: '600' }}>{target ? goalMet ? 'Goal complete! Nice work.' : `${remaining} pages to go — you’ve got this!` : 'Pick a book to set your first goal.'}</Copy></Card>
    <View style={{ flexDirection: 'row', gap: 12 }}><Card style={{ flex: 1, gap: 2 }}><Copy style={{ color: c.gold, fontSize: 12, fontWeight: '800' }}>✦ STREAK</Copy><Copy style={{ fontSize: 24, lineHeight: 32, fontWeight: '800' }}>{streak(reading.logs, reading.goals, today)} days</Copy></Card><Card style={{ flex: 1, gap: 2 }}><Copy style={{ color: c.accent, fontSize: 12, fontWeight: '800' }}>▤ THIS WEEK</Copy><Copy style={{ fontSize: 24, lineHeight: 32, fontWeight: '800' }}>{weekly} pages</Copy></Card></View>
    <View style={ui.row}><Copy style={ui.heading}>Your next chapter</Copy><Link href="/library" style={{ color: c.accent, fontWeight: '700', paddingVertical: 10 }}>SEE ALL</Link></View>
    {current ? <Card><View style={{ flexDirection: 'row', gap: 16 }}><Cover book={current} /><View style={{ flex: 1, justifyContent: 'center', gap: 6 }}><Copy style={{ color: c.accent, fontSize: 11, fontWeight: '800' }}>CURRENTLY READING</Copy><Copy style={ui.heading}>{current.title}</Copy><Copy style={ui.muted}>{current.author || 'Author not specified'}</Copy><Copy style={{ fontWeight: '600' }}>Page {current.currentPage} of {current.totalPages}</Copy></View></View><Progress value={current.currentPage / current.totalPages} label="Book progress" /><Button label="CONTINUE READING" onPress={() => router.push({ pathname: '/reading/[id]', params: { id: current.id } })} /></Card> : <Card><Copy style={ui.heading}>{books.length ? 'Ready for a new book?' : 'Your first chapter starts here'}</Copy><Copy style={ui.muted}>{books.length ? 'Choose a book from your library to continue.' : 'Add a book and set a goal that feels right for you.'}</Copy><Button label={books.length ? 'OPEN LIBRARY' : 'ADD A BOOK'} onPress={() => router.push(books.length ? '/library' : '/books/new')} /></Card>}
    {!!reading.error && <Copy accessibilityRole="alert">{reading.error}</Copy>}<Copy style={{ textAlign: 'center', color: c.muted, fontSize: 12 }}>Saved locally · Not synced</Copy>
  </Screen>;
}
