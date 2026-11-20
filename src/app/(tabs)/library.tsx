import { useState } from 'react';
import { router } from 'expo-router';
import { Pressable, ScrollView, View } from 'react-native';
import { Button, Card, Copy, Screen, ui } from '@/components/reading-ui';
import { palette as c } from '@/constants/design';
import { BookCard } from '@/features/books/book-card';
import { useBooks } from '@/features/books/books-provider';
import { LibraryState } from '@/features/books/library-state';
import { statusLabels, type BookStatus } from '@/features/books/model';
export default function LibraryScreen() {
  const { books, loading, error } = useBooks(); const [filter, setFilter] = useState<BookStatus | 'all'>('all');
  if (loading || error) return <LibraryState />;
  const visible = filter === 'all' ? books : books.filter(book => book.status === filter);
  const filters: { value: BookStatus | 'all'; label: string }[] = [{ value: 'all', label: 'All' }, { value: 'reading', label: 'Reading' }, { value: 'planned', label: 'Want to read' }, { value: 'completed', label: 'Finished' }];
  return <Screen><View style={ui.row}><View style={{ flex: 1, gap: 4 }}><Copy style={ui.title}>Your library</Copy><Copy style={ui.muted}>{books.length} {books.length === 1 ? 'book' : 'books'} in your collection</Copy></View><Copy style={{ fontSize: 30 }}>▤</Copy></View>
    <Button label="＋  ADD A BOOK" onPress={() => router.push('/books/new')} />
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
      {filters.map(item => <Pressable accessibilityRole="button" accessibilityState={{ selected: filter === item.value }} key={item.value} onPress={() => setFilter(item.value)} style={{ borderRadius: 14, borderWidth: 2, borderColor: filter === item.value ? c.lemon : c.line, backgroundColor: filter === item.value ? c.softGreen : c.surface, paddingHorizontal: 14, paddingVertical: 9 }}><Copy style={{ color: filter === item.value ? c.accent : c.muted, fontWeight: '700' }}>{item.label}</Copy></Pressable>)}
    </ScrollView>
    <Copy style={ui.heading}>{filter === 'all' ? 'All books' : statusLabels[filter]} · {visible.length}</Copy>
    {visible.map(book => <BookCard key={book.id} book={book} />)}
    {!visible.length && <Card style={{ alignItems: 'center', paddingVertical: 32 }}><Copy style={{ fontSize: 32 }}>▤</Copy><Copy style={ui.heading}>{books.length ? 'Nothing here yet' : 'Your shelf is waiting'}</Copy><Copy style={[ui.muted, { textAlign: 'center' }]}>{books.length ? 'Try another category or add a book.' : 'Add a book to start your reading journey.'}</Copy></Card>}
  </Screen>;
}
