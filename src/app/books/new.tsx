import { BookForm } from '@/features/books/book-form';
import { useBooks } from '@/features/books/books-provider';
import { LibraryState } from '@/features/books/library-state';
export default function AddBookScreen() {
  const { loading, error } = useBooks();
  return loading || error ? <LibraryState /> : <BookForm />;
}
