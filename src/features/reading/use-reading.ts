import { useCallback, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import { database } from '@/storage/database';
import { readingData } from '@/storage/reading';
import type { Goal, ReadingLog, Report } from './model';
export function useReading() {
  const [data, setData] = useState<{ logs: ReadingLog[]; goals: Goal[]; reports: Report[] }>({ logs: [], goals: [], reports: [] });
  const [error, setError] = useState<string | null>(null);
  const refresh = useCallback(async () => { try { setData(await readingData(await database())); setError(null); } catch { setError('Could not load your saved reading data. Please try again.'); } }, []);
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));
  return { ...data, error, refresh };
}
