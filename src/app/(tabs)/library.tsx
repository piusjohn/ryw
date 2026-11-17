import { router } from 'expo-router';
import { View } from 'react-native';
import { Button, Card, Copy, Screen, ui } from '@/components/reading-ui';
import { BookCard } from '@/features/books/book-card';
import { useBooks } from '@/features/books/books-provider';
import { LibraryState } from '@/features/books/library-state';
import { statusLabels, type BookStatus } from '@/features/books/model';
export default function LibraryScreen() {
  const { books, loading, error } = useBooks();
  if (loading || error) return <LibraryState />;
  return <Screen><Copy style={ui.eyebrow}>YOUR PERSONAL BOOKSHELF</Copy><Copy style={ui.title}>Library</Copy>
    <Button label="＋ Add Book" onPress={() => router.push('/books/new')} />
    {!books.length && <Card><Copy style={ui.heading}>Start your next chapter</Copy><Copy style={ui.muted}>Add your first book and choose a daily page target. Your library stays on this device, ready whenever you are.</Copy></Card>}
    {(Object.keys(statusLabels) as BookStatus[]).map(status => <View key={status} style={{ gap: 16 }}>
      <Copy style={ui.heading}>{statusLabels[status]} · {books.filter(book => book.status === status).length}</Copy>
      {books.filter(book => book.status === status).map(book => <BookCard key={book.id} book={book} />)}
      {!books.some(book => book.status === status) && <Copy style={ui.muted}>No books here yet.</Copy>}
    </View>)}
  </Screen>;
}
