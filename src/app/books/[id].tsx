import { router } from 'expo-router';
import { Button, Card, Copy, Screen, ui } from '@/components/reading-ui';
import { BookCard } from '@/features/books/book-card';
import { LibraryState } from '@/features/books/library-state';
import { useSelectedBook } from '@/features/books/use-selected-book';
export default function BookDetailsScreen() {
  const { book, loading, error } = useSelectedBook();
  if (loading || error) return <LibraryState />;
  if (!book) return <Screen><Copy>Book not found.</Copy><Button label="Open library" onPress={() => router.replace('/library')} /></Screen>;
  return <Screen><Copy style={ui.eyebrow}>YOUR READING JOURNEY</Copy><BookCard book={book} details />
    <Button label="Edit book & daily goal" onPress={() => router.push({ pathname: '/books/edit', params: { id: book.id } })} />
    <Card><Copy style={ui.heading}>A goal is a starting point</Copy><Copy style={ui.muted}>Your daily target helps estimate how many reading days remain. Estimates assume you read your target each day. Reading sessions and daily activity tracking arrive in Phase 3.</Copy></Card>
  </Screen>;
}
