import type { Book, BookDraft } from '../features/books/model';
export interface BookDatabase {
  getAllAsync<T>(sql: string): Promise<T[]>;
  runAsync(sql: string, ...params: (string | number | null)[]): Promise<{ lastInsertRowId: number; changes: number }>;
}
export const listBooks = (db: BookDatabase) => db.getAllAsync<Book>('SELECT * FROM books ORDER BY id DESC');
export async function saveBook(db: BookDatabase, book: BookDraft, id?: number): Promise<number> {
  const params = [book.title, book.author, book.totalPages, book.currentPage, book.dailyTarget, book.status, book.cover];
  if (id !== undefined) {
    const result = await db.runAsync('UPDATE books SET title=?, author=?, totalPages=?, currentPage=?, dailyTarget=?, status=?, cover=? WHERE id=?', ...params, id);
    if (!result.changes) throw new Error('This book no longer exists.');
    return id;
  }
  return (await db.runAsync('INSERT INTO books (title,author,totalPages,currentPage,dailyTarget,status,cover) VALUES (?,?,?,?,?,?,?)', ...params)).lastInsertRowId;
}
