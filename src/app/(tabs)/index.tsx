import { useState } from 'react';
import { Modal, View } from 'react-native';
import { Link, router } from 'expo-router';
import { Button, Card, Copy, Progress, Screen, ui } from '@/components/reading-ui';
import { palette as c } from '@/constants/design';
import { useBooks } from '@/features/books/books-provider';
import { BookCard } from '@/features/books/book-card';
import { LibraryState } from '@/features/books/library-state';
export default function HomeScreen() {
  const { books, loading, error } = useBooks();
  const [showPreview, setShowPreview] = useState(false);
  if (loading || error) return <LibraryState />;
  const active = books.filter(book => book.status === 'reading');
  const target = active.reduce((sum, book) => sum + book.dailyTarget, 0);
  return <Screen>
    <View style={ui.row}><Copy style={ui.eyebrow}>READING ACCOUNTABILITY</Copy><Link href="/profile" style={ui.badge}>Profile</Link></View>
    <View style={{ gap: 8 }}><Copy style={ui.title}>Small pages.{'\n'}Big possibilities.</Copy><Copy style={ui.muted}>Make a little room for reading today.</Copy></View>
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {[{ value: active.length, label: 'Reading' }, { value: books.filter(book => book.status === 'completed').length, label: 'Completed' }, { value: books.length, label: 'In your library' }].map(stat => <Card key={stat.label} style={{ flex: 1, padding: 12, alignItems: 'center' }}><Copy style={ui.heading}>{stat.value}</Copy><Copy style={{ fontSize: 11, color: c.muted, textAlign: 'center' }}>{stat.label}</Copy></Card>)}
    </View>
    <Card style={{ backgroundColor: c.greenDark, borderColor: c.greenDark }}><Copy style={{ color: c.lime, fontSize: 11, letterSpacing: 1.5 }}>YOUR DAILY PLAN</Copy>
      <Copy style={{ color: c.surface, fontSize: 32, lineHeight: 40, fontWeight: '700' }}>{target} pages / day</Copy>
      <Progress value={0} label="Daily reading activity not yet tracked" inverted />
      <Copy style={{ color: c.lime }}>{active.length ? `Across ${active.length} currently reading ${active.length === 1 ? 'book' : 'books'}.` : 'Add a book or move one to Currently Reading to set your daily plan.'}</Copy>
      <Copy style={{ color: c.surface }}>Goals plan your reading. Daily activity tracking starts in Phase 3.</Copy>
    </Card>
    <View style={ui.row}><Copy style={ui.heading}>Continue reading</Copy><Link href="/library" style={{ color: c.green, paddingVertical: 12 }}>My library →</Link></View>
    {active.map(book => <BookCard key={book.id} book={book} />)}
    {!active.length && <Card><Copy style={ui.heading}>{books.length ? 'Choose your next read' : 'Your story starts here'}</Copy><Copy style={ui.muted}>{books.length ? 'Open your library to update a book’s reading status.' : 'Add your first book and make a daily plan that works for you.'}</Copy><Button label={books.length ? 'Open library' : '＋ Add Book'} onPress={() => router.push(books.length ? '/library' : '/books/new')} /></Card>}
    {!!active.length && <Button label="Log Reading · Coming in Phase 3" onPress={() => setShowPreview(true)} />}
    <Copy style={{ textAlign: 'center', color: c.muted, fontSize: 12 }}>Saved on this device · Ready offline</Copy>
    <Modal visible={showPreview} transparent animationType="fade" onRequestClose={() => setShowPreview(false)}>
      <View style={{ flex: 1, padding: 24, backgroundColor: '#10271CB3', justifyContent: 'center' }}><Card style={{ maxWidth: 480, width: '100%', alignSelf: 'center' }}><Copy style={ui.heading}>Every page counts.</Copy><Copy>Recording reading sessions arrives in Phase 3. Your books and daily goals are saved locally; this preview does not change progress.</Copy><Button label="Back to dashboard" onPress={() => setShowPreview(false)} /></Card></View>
    </Modal>
  </Screen>;
}
