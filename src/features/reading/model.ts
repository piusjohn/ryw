export type ReadingLog = { id: string; bookId: number; startPage: number; endPage: number; readingDate: string; reflection: string; createdAt: string; updatedAt: string; deletedAt: string | null; syncState: string };
export type Goal = { bookId: number; readingDate: string; target: number };
export type Report = { id: string; bookId: number; readingDate: string; reflection: string; status: 'draft' | 'ready'; createdAt: string; updatedAt: string; deletedAt: string | null; syncState: string };
export type Timer = { bookId: number; elapsedMs: number; runningSince: string | null };
export function localDate(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}
export function validDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const [y, m, d] = value.split('-').map(Number); const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}
export function previousDate(value: string): string {
  const [y, m, d] = value.split('-').map(Number); return localDate(new Date(y, m - 1, d - 1));
}
export function pages(log: Pick<ReadingLog, 'startPage' | 'endPage'>) { return log.endPage - log.startPage; }
export function validateRange(start: number, end: number, total: number, logs: ReadingLog[], id?: string): string | null {
  if (!Number.isSafeInteger(start) || start < 0 || !Number.isSafeInteger(end)) return 'Enter whole page numbers starting at zero or greater.';
  if (end <= start) return 'Ending page must be greater than starting page.';
  if (end > total) return 'Ending page cannot exceed the total pages.';
  if (logs.some(log => !log.deletedAt && log.id !== id && start < log.endPage && end > log.startPage)) return 'This range overlaps an existing reading log.';
  return null;
}
export function totalForDate(logs: ReadingLog[], date: string, bookId?: number) {
  return logs.filter(l => !l.deletedAt && l.readingDate === date && (bookId === undefined || l.bookId === bookId)).reduce((sum, l) => sum + pages(l), 0);
}
export function streak(logs: ReadingLog[], goals: Goal[], today: string): number {
  const successful = (date: string) => {
    const day = goals.filter(g => g.readingDate === date);
    return day.length > 0 && day.every(g => totalForDate(logs, date, g.bookId) >= g.target);
  };
  let day = successful(today) ? today : previousDate(today); let count = 0;
  while (successful(day)) { count++; day = previousDate(day); }
  return count;
}
export function elapsed(timer: Timer | null, now = Date.now()) { return timer ? timer.elapsedMs + (timer.runningSince ? Math.max(0, now - Date.parse(timer.runningSince)) : 0) : 0; }
