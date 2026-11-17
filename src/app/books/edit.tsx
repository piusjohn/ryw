import { BookForm } from '@/features/books/book-form';
import { LibraryState } from '@/features/books/library-state';
import { useSelectedBook } from '@/features/books/use-selected-book';
import { Copy, Screen } from '@/components/reading-ui';
export default function EditBookScreen() {
  const { book, loading, error } = useSelectedBook();
  if (loading || error) return <LibraryState />;
  return book ? <BookForm key={book.id} book={book} /> : <Screen><Copy>Book not found. Return to your library to choose a book.</Copy></Screen>;
}
