import { createContext, useCallback, useContext, useEffect, useRef, useState, type PropsWithChildren } from 'react';
import type { Book, BookDraft } from './model';
import { database } from '@/storage/database';
import { listBooks, saveBook } from '@/storage/repository';
import { removeCover, storeCover } from '@/storage/covers';

type BooksContextValue = { books: Book[]; loading: boolean; error: string | null; reload: () => Promise<void>; save: (draft: BookDraft, id?: number, pickedUri?: string | null) => Promise<number> };
const BooksContext = createContext<BooksContextValue | null>(null);
export function BooksProvider({ children }: PropsWithChildren) {
  const [books, setBooks] = useState<Book[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const saving = useRef(false);
  const reload = useCallback(async () => {
    setError(null);
    try { setBooks(await listBooks(await database())); }
    catch { setError('We couldn’t open your local library. Your saved books have not been removed. Please try again.'); }
    finally { setLoading(false); }
  }, []);
  useEffect(() => {
    let active = true;
    void database().then(listBooks).then(rows => {
      if (active) { setBooks(rows); setError(null); }
    }).catch(() => {
      if (active) setError('We couldn’t open your local library. Your saved books have not been removed. Please try again.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, []);
  const save = async (draft: BookDraft, id?: number, pickedUri?: string | null) => {
    if (saving.current) throw new Error('A book is already being saved. Please try again.');
    saving.current = true;
    let copied: string | null = null;
    try {
      const db = await database();
      if (pickedUri) copied = await storeCover(pickedUri);
      const saved = { ...draft, cover: copied ?? draft.cover };
      let savedId: number;
      try { savedId = await saveBook(db, saved, id); }
      catch (error) { if (copied) await removeCover(copied).catch(() => {}); throw error; }
      // Update local state after the committed write. Navigation never depends on a second query.
      setBooks(previous => [{ ...saved, id: savedId }, ...previous.filter(book => book.id !== savedId)]);
      const old = books.find(book => book.id === id)?.cover;
      if (old && old !== saved.cover) await removeCover(old).catch(() => {});
      return savedId;
    } finally { saving.current = false; }
  };
  return <BooksContext value={{ books, loading, error, reload, save }}>{children}</BooksContext>;
}
export function useBooks() {
  const value = useContext(BooksContext);
  if (!value) throw new Error('BooksProvider is missing.');
  return value;
}
