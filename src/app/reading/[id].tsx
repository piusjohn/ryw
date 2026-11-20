import { router } from 'expo-router';
import { Button, Copy, Screen } from '@/components/reading-ui';
import { LibraryState } from '@/features/books/library-state';
import { useSelectedBook } from '@/features/books/use-selected-book';
import { ReadingScreen } from '@/features/reading/reading-screen';
export default function SessionRoute() {
  const { book, loading, error } = useSelectedBook();
  if (loading || error) return <LibraryState />;
  if (!book) return <Screen><Copy>Book not found.</Copy><Button label="Open library" onPress={() => router.replace('/library')} /></Screen>;
  return <ReadingScreen book={book} />;
}
