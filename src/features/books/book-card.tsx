import { Image } from 'expo-image';
import { Link } from 'expo-router';
import { View } from 'react-native';
import { Card, Copy, Progress, ui } from '@/components/reading-ui';
import { coverUri } from '@/storage/covers';
import { remainingDays, statusLabels, type Book } from './model';
export function Cover({ book }: { book: Pick<Book, 'cover' | 'title'> }) {
  const uri = coverUri(book.cover);
  return uri ? <Image source={{ uri }} accessibilityLabel={`Cover of ${book.title}`} style={{ width: 80, height: 116, borderRadius: 8 }} contentFit="cover" />
    : <View style={[ui.cover, { width: 80, minHeight: 116 }]}><Copy style={ui.coverSmall}>YOUR NEXT CHAPTER</Copy><Copy numberOfLines={4} style={ui.coverTitle}>{book.title}</Copy></View>;
}
export function BookCard({ book, details = false }: { book: Book; details?: boolean }) {
  return <Card><View style={{ flexDirection: 'row', gap: 16 }}><Cover book={book} /><View style={{ flex: 1, gap: 6 }}>
    <Copy style={ui.heading}>{book.title}</Copy><Copy style={ui.muted}>{book.author || 'Author not specified'}</Copy><Copy style={{ fontSize: 12 }}>{statusLabels[book.status]}</Copy>
    <Copy style={{ fontSize: 12 }}>{book.totalPages} total pages</Copy>
  </View></View>
    <Progress value={book.currentPage / book.totalPages} label={`${book.title} progress`} />
    <Copy>{book.currentPage} / {book.totalPages} pages · {Math.round(book.currentPage / book.totalPages * 100)}%</Copy>
    <Copy style={ui.muted}>{book.dailyTarget} pages/day · {remainingDays(book)} estimated reading days left</Copy>
    {!details && <Link href={{ pathname: '/books/[id]', params: { id: book.id } }} style={{ paddingVertical: 12, fontWeight: '700' }}>View book →</Link>}
  </Card>;
}
