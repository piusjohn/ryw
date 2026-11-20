import { View } from 'react-native';
import { Link, router } from 'expo-router';
import { Button, Card, Copy, Progress, Screen, ui } from '@/components/reading-ui';
import { palette as c } from '@/constants/design';
import { useBooks } from '@/features/books/books-provider';
import { BookCard } from '@/features/books/book-card';
import { LibraryState } from '@/features/books/library-state';
import { localDate, pages, previousDate, streak, totalForDate } from '@/features/reading/model';
import { useReading } from '@/features/reading/use-reading';
export default function HomeScreen() {
  const { books, loading, error } = useBooks(); const reading = useReading();
  if (loading || error) return <LibraryState />;
  const active = books.filter(book => book.status === 'reading'); const current = active[0]; const today = localDate();
  const todaysGoals = reading.goals.filter(g => g.readingDate === today);
  const target = todaysGoals.reduce((sum, goal) => sum + goal.target, 0) + active.filter(book => !todaysGoals.some(goal => goal.bookId === book.id)).reduce((sum, book) => sum + book.dailyTarget, 0);
  const todayPages = totalForDate(reading.logs, today);
  const dailyGoals = [...todaysGoals, ...active.filter(book => !todaysGoals.some(goal => goal.bookId === book.id)).map(book => ({ bookId: book.id, readingDate: today, target: book.dailyTarget }))];
  const goalMet = dailyGoals.length > 0 && dailyGoals.every(goal => totalForDate(reading.logs, today, goal.bookId) >= goal.target);
  const remaining = dailyGoals.reduce((sum, goal) => sum + Math.max(0, goal.target - totalForDate(reading.logs, today, goal.bookId)), 0);
  let weekStart = today; for (let i = 0; i < 6; i++) weekStart = previousDate(weekStart);
  const weekly = reading.logs.filter(l => l.readingDate >= weekStart && l.readingDate <= today).reduce((sum, l) => sum + pages(l), 0);
  return <Screen><View style={ui.row}><Copy style={ui.eyebrow}>READING ACCOUNTABILITY</Copy><Link href="/profile" style={ui.badge}>Profile</Link></View>
    <View style={{ gap: 8 }}><Copy style={ui.title}>Small pages.{'\n'}Big possibilities.</Copy><Copy style={ui.muted}>Make a little room for reading today.</Copy></View>
    <View style={{ flexDirection: 'row', gap: 8 }}><Card style={{ flex: 1, alignItems: 'center' }}><Copy style={ui.heading}>{streak(reading.logs, reading.goals, today)}</Copy><Copy style={ui.muted}>Day streak</Copy></Card><Card style={{ flex: 1, alignItems: 'center' }}><Copy style={ui.heading}>{weekly}</Copy><Copy style={ui.muted}>Pages · 7 days</Copy></Card></View>
    <Card style={{ backgroundColor: c.orangeDark, borderColor: c.orangeDark }}><Copy style={{ color: c.cream, fontSize: 11, letterSpacing: 1.5 }}>TODAY’S READING</Copy><Copy style={{ color: c.surface, fontSize: 32, lineHeight: 40, fontWeight: '700' }}>{todayPages} / {target} pages</Copy><Progress value={target ? todayPages / target : 0} label="Today's reading progress" inverted /><Copy style={{ color: c.surface }}>{target ? goalMet ? 'Goal met. Well done!' : `${remaining} pages remaining across your goals` : 'Choose a book to begin your daily plan.'}</Copy></Card>
    <View style={ui.row}><Copy style={ui.heading}>Continue reading</Copy><Link href="/library" style={{ color: c.orange, paddingVertical: 12 }}>My library →</Link></View>
    {current ? <><BookCard book={current} /><Button label="Continue Reading" onPress={() => router.push({ pathname: '/reading/[id]', params: { id: current.id } })} /></> : <Card><Copy style={ui.heading}>{books.length ? 'Choose your next read' : 'Your story starts here'}</Copy><Copy style={ui.muted}>{books.length ? 'Open your library to update a book’s reading status.' : 'Add your first book and make a daily plan that works for you.'}</Copy><Button label={books.length ? 'Open library' : '＋ Add Book'} onPress={() => router.push(books.length ? '/library' : '/books/new')} /></Card>}
    {!!reading.error && <Copy accessibilityRole="alert">{reading.error}</Copy>}<Copy style={{ textAlign: 'center', color: c.muted, fontSize: 12 }}>Saved locally · Not synced</Copy>
  </Screen>;
}
