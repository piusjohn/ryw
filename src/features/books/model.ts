export const statusLabels = { reading: 'Currently Reading', completed: 'Completed', planned: 'Want to Read' } as const;
export type BookStatus = keyof typeof statusLabels;
export type Book = {
  id: number; title: string; author: string; totalPages: number; currentPage: number;
  dailyTarget: number; status: BookStatus; cover: string | null;
};
export type BookDraft = Omit<Book, 'id'>;
export type BookFields = { title: string; author: string; totalPages: string; currentPage: string; dailyTarget: string; status: BookStatus };
export type FieldErrors = Partial<Record<keyof BookFields, string>>;
export const emptyFields: BookFields = { title: '', author: '', totalPages: '', currentPage: '0', dailyTarget: '', status: 'reading' };
export function validateBook(fields: BookFields): FieldErrors {
  const errors: FieldErrors = {};
  if (!fields.title.trim()) errors.title = 'Enter a book title.';
  const positive = (text: string) => /^\d+$/.test(text.trim()) && Number.isSafeInteger(Number(text)) && Number(text) > 0 && Number(text) <= 2147483647;
  if (!positive(fields.totalPages)) errors.totalPages = 'Enter a whole number of pages greater than zero (up to 2,147,483,647).';
  if (!positive(fields.dailyTarget)) errors.dailyTarget = 'Enter a whole daily target greater than zero (up to 2,147,483,647).';
  if (!/^\d+$/.test(fields.currentPage.trim()) || !Number.isSafeInteger(Number(fields.currentPage)) || Number(fields.currentPage) > Number(fields.totalPages)) errors.currentPage = 'Enter a whole current page between 0 and the total pages.';
  if (!(Object.hasOwn(statusLabels, fields.status))) errors.status = 'Choose a reading status.';
  if (fields.status === 'completed' && Number(fields.currentPage) !== Number(fields.totalPages)) errors.status = 'Completed books must be at the final page. Correct the current page or choose another status.';
  return errors;
}
export function remainingDays(book: Pick<Book, 'totalPages' | 'currentPage' | 'dailyTarget'>): number {
  return Math.ceil(Math.max(0, book.totalPages - book.currentPage) / book.dailyTarget);
}
export function toDraft(fields: BookFields, cover: string | null): BookDraft {
  if (Object.keys(validateBook(fields)).length) throw new Error('Invalid book details.');
  return { title: fields.title.trim(), author: fields.author.trim(), totalPages: Number(fields.totalPages), currentPage: Number(fields.currentPage), dailyTarget: Number(fields.dailyTarget), status: fields.status, cover };
}
