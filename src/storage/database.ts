import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';
import { migrate } from './migrations';
let connection: Promise<SQLiteDatabase> | undefined;
export function database() {
  if (!connection) connection = (async () => {
    const db = await openDatabaseAsync('reading-accountability.db');
    try { await db.execAsync('PRAGMA journal_mode = WAL'); await migrate(db); return db; }
    catch (error) { await db.closeAsync(); throw error; }
  })().catch(error => { connection = undefined; throw error; });
  return connection;
}
