import { router } from 'expo-router';
import { Button, Card, Copy, Screen, ui } from '@/components/reading-ui';
import { BookCard } from '@/features/books/book-card';
import { LibraryState } from '@/features/books/library-state';
import { useSelectedBook } from '@/features/books/use-selected-book';
import { useReading } from '@/features/reading/use-reading';
import { pages } from '@/features/reading/model';
export default function BookDetailsScreen() {
  const { book, loading, error } = useSelectedBook();
  const { logs } = useReading();
  if (loading || error) return <LibraryState />;
  if (!book) return <Screen><Copy>Book not found.</Copy><Button label="Open library" onPress={() => router.replace('/library')} /></Screen>;
  return <Screen><Copy style={ui.eyebrow}>YOUR READING JOURNEY</Copy><BookCard book={book} details />
    <Button label="Start Reading" onPress={() => router.push({ pathname: '/reading/[id]', params: { id: book.id } })} />
    <Button label="Log Reading & view history" secondary onPress={() => router.push({ pathname: '/reading/[id]', params: { id: book.id } })} />
    <Button label="Edit book & daily goal" onPress={() => router.push({ pathname: '/books/edit', params: { id: book.id } })} />
    <Card><Copy style={ui.heading}>Reading history</Copy>{logs.filter(log => log.bookId === book.id).length ? logs.filter(log => log.bookId === book.id).slice(0, 5).map(log => <Copy key={log.id}>{log.readingDate} · {pages(log)} pages ({log.startPage} → {log.endPage})</Copy>) : <Copy style={ui.muted}>Your reading sessions will appear here.</Copy>}</Card>
    <Card><Copy style={ui.heading}>A goal is a starting point</Copy><Copy style={ui.muted}>Your daily target helps estimate how many reading days remain. Estimates assume you read your target each day.</Copy></Card>
  </Screen>;
}
