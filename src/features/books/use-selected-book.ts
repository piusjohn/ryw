import { useLocalSearchParams } from 'expo-router';
import { useBooks } from './books-provider';
export function useSelectedBook() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const library = useBooks();
  return { ...library, book: library.books.find(book => String(book.id) === id) };
}
