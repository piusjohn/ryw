import type { SQLiteDatabase } from 'expo-sqlite';
import { localDate, validDate, validateRange, type Goal, type ReadingLog, type Report, type Timer } from '../features/reading/model.ts';
import type { Book } from '../features/books/model';

// Random local IDs do not depend on a network or a database row number.
export function newId() { return `${Date.now().toString(36)}-${Array.from({ length: 4 }, () => Math.random().toString(36).slice(2, 10)).join('')}`; }
export async function readingData(db: SQLiteDatabase) {
  const logs = await db.getAllAsync<ReadingLog>('SELECT * FROM reading_logs WHERE deletedAt IS NULL ORDER BY readingDate DESC, createdAt DESC');
  const goals = await db.getAllAsync<Goal>('SELECT * FROM daily_goals');
  const reports = await db.getAllAsync<Report>('SELECT * FROM reading_reports WHERE deletedAt IS NULL ORDER BY readingDate DESC, createdAt DESC');
  return { logs, goals, reports };
}
export async function saveLog(db: SQLiteDatabase, book: Book, input: { id?: string; startPage: number; endPage: number; readingDate: string; reflection: string }) {
  if (!validDate(input.readingDate) || input.readingDate > localDate()) throw new Error('Enter a valid reading date, no later than today (YYYY-MM-DD).');
  const now = new Date().toISOString(); const id = input.id ?? newId();
  await db.withTransactionAsync(async () => {
    const logs = await db.getAllAsync<ReadingLog>('SELECT * FROM reading_logs WHERE bookId=? AND deletedAt IS NULL', book.id);
    const error = validateRange(input.startPage, input.endPage, book.totalPages, logs, input.id); if (error) throw new Error(error);
    if (input.id) {
      const result = await db.runAsync('UPDATE reading_logs SET startPage=?, endPage=?, readingDate=?, reflection=?, updatedAt=?, syncState=? WHERE id=? AND bookId=? AND deletedAt IS NULL', input.startPage, input.endPage, input.readingDate, input.reflection.trim(), now, 'pending', id, book.id);
      if (!result.changes) throw new Error('This log no longer exists.');
    } else await db.runAsync('INSERT INTO reading_logs (id,bookId,startPage,endPage,readingDate,reflection,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?,?)', id, book.id, input.startPage, input.endPage, input.readingDate, input.reflection.trim(), now, now);
    await db.runAsync('INSERT OR IGNORE INTO daily_goals (bookId,readingDate,target,createdAt,updatedAt) VALUES (?,?,?,?,?)', book.id, input.readingDate, book.dailyTarget, now, now);
    await updatePosition(db, book.id);
  });
  return id;
}
async function updatePosition(db: SQLiteDatabase, bookId: number) {
  await db.runAsync("UPDATE books SET currentPage = max(basePage, coalesce((SELECT max(endPage) FROM reading_logs WHERE bookId=? AND deletedAt IS NULL), 0)), status = CASE WHEN max(basePage, coalesce((SELECT max(endPage) FROM reading_logs WHERE bookId=? AND deletedAt IS NULL), 0)) = totalPages THEN 'completed' WHEN status = 'completed' THEN 'reading' ELSE status END WHERE id=?", bookId, bookId, bookId);
}
export async function deleteLog(db: SQLiteDatabase, log: ReadingLog) {
  await db.withTransactionAsync(async () => { await db.runAsync("UPDATE reading_logs SET deletedAt=?, updatedAt=?, syncState='pending' WHERE id=?", new Date().toISOString(), new Date().toISOString(), log.id); await updatePosition(db, log.bookId); });
}
export async function saveReport(db: SQLiteDatabase, report: { id?: string; bookId: number; readingDate: string; reflection: string; status: 'draft' | 'ready' }) {
  const now = new Date().toISOString(); const id = report.id ?? newId();
  if (report.id) await db.runAsync("UPDATE reading_reports SET reflection=?, status=?, updatedAt=?, syncState='pending' WHERE id=? AND deletedAt IS NULL", report.reflection.trim(), report.status, now, id);
  else await db.runAsync('INSERT INTO reading_reports (id,bookId,readingDate,reflection,status,createdAt,updatedAt) VALUES (?,?,?,?,?,?,?)', id, report.bookId, report.readingDate, report.reflection.trim(), report.status, now, now);
  return id;
}
export async function deleteReport(db: SQLiteDatabase, id: string) { const now = new Date().toISOString(); await db.runAsync("UPDATE reading_reports SET deletedAt=?, updatedAt=?, syncState='pending' WHERE id=? AND status='draft'", now, now, id); }
export async function getTimer(db: SQLiteDatabase, bookId: number) { return db.getFirstAsync<Timer>('SELECT bookId,elapsedMs,runningSince FROM reading_timers WHERE bookId=?', bookId); }
export async function setTimer(db: SQLiteDatabase, bookId: number, elapsedMs: number, runningSince: string | null) {
  await db.runAsync("INSERT INTO reading_timers (bookId,elapsedMs,runningSince,updatedAt) VALUES (?,?,?,?) ON CONFLICT(bookId) DO UPDATE SET elapsedMs=excluded.elapsedMs,runningSince=excluded.runningSince,updatedAt=excluded.updatedAt,syncState='pending'", bookId, elapsedMs, runningSince, new Date().toISOString());
}
