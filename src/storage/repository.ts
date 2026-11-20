import type { Book, BookDraft } from '../features/books/model';
export interface BookDatabase {
  getAllAsync<T>(sql: string): Promise<T[]>;
  runAsync(sql: string, ...params: (string | number | null)[]): Promise<{ lastInsertRowId: number; changes: number }>;
}
export const listBooks = (db: BookDatabase) => db.getAllAsync<Book>('SELECT * FROM books ORDER BY id DESC');
export async function saveBook(db: BookDatabase, book: BookDraft, id?: number): Promise<number> {
  const params = [book.title, book.author, book.totalPages, book.currentPage, book.dailyTarget, book.status, book.cover, book.pdf ?? null];
  if (id !== undefined) {
    const result = await db.runAsync('UPDATE books SET title=?, author=?, totalPages=?, currentPage=?, dailyTarget=?, status=?, cover=?, pdf=?, basePage=CASE WHEN EXISTS (SELECT 1 FROM reading_logs WHERE bookId=books.id AND deletedAt IS NULL) THEN basePage ELSE ? END WHERE id=? AND (NOT EXISTS (SELECT 1 FROM reading_logs WHERE bookId=books.id AND deletedAt IS NULL) OR currentPage=?) AND ? >= coalesce((SELECT max(endPage) FROM reading_logs WHERE bookId=books.id AND deletedAt IS NULL), 0)', ...params, book.currentPage, id, book.currentPage, book.totalPages);
    if (!result.changes) throw new Error('This book no longer exists, or its saved reading history conflicts with the page changes. Edit its reading logs first.');
    return id;
  }
  return (await db.runAsync('INSERT INTO books (title,author,totalPages,currentPage,dailyTarget,status,cover,pdf,basePage) VALUES (?,?,?,?,?,?,?,?,?)', ...params, book.currentPage)).lastInsertRowId;
}
