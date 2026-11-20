// Each migration and its version update are committed in the same transaction.
// Stable cloud IDs are separate from existing local IDs, which remain unchanged.
const uuidSql = "lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab', (random() & 3) + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6)))";
function syncTriggers(table: string, key: string) {
  const name = table.replace(/[^a-z_]/g, '');
  return ['INSERT', 'UPDATE'].map(action => `
    CREATE TRIGGER sync_${name}_${action.toLowerCase()} AFTER ${action} ON ${table}
    WHEN (SELECT suppress FROM sync_control WHERE id=1)=0 BEGIN
      INSERT OR IGNORE INTO sync_identity (entity, local_key, cloud_id) VALUES ('${table}', ${key}, ${uuidSql});
      INSERT INTO sync_outbox (entity, local_key, generation, attempts, next_attempt_at)
      VALUES ('${table}', ${key}, 1, 0, 0)
      ON CONFLICT(entity, local_key) DO UPDATE SET generation=generation+1, attempts=0, next_attempt_at=0;
    END;`).join('');
}

export const migrations = [
  `CREATE TABLE books (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL CHECK(length(trim(title)) > 0),
    author TEXT NOT NULL DEFAULT '',
    totalPages INTEGER NOT NULL CHECK(typeof(totalPages) = 'integer' AND totalPages > 0),
    currentPage INTEGER NOT NULL DEFAULT 0 CHECK(typeof(currentPage) = 'integer' AND currentPage >= 0 AND currentPage <= totalPages),
    dailyTarget INTEGER NOT NULL CHECK(typeof(dailyTarget) = 'integer' AND dailyTarget > 0),
    status TEXT NOT NULL CHECK(status IN ('reading', 'completed', 'planned')),
    cover TEXT,
    CHECK(status != 'completed' OR currentPage = totalPages)
  );`,
  `ALTER TABLE books ADD COLUMN basePage INTEGER NOT NULL DEFAULT 0;
  UPDATE books SET basePage = currentPage;
  CREATE TABLE reading_logs (id TEXT PRIMARY KEY, bookId INTEGER NOT NULL REFERENCES books(id), startPage INTEGER NOT NULL, endPage INTEGER NOT NULL, readingDate TEXT NOT NULL, reflection TEXT NOT NULL DEFAULT '', createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL, deletedAt TEXT, syncState TEXT NOT NULL DEFAULT 'pending', CHECK(startPage >= 0 AND endPage > startPage));
  CREATE INDEX reading_logs_book_date ON reading_logs(bookId, readingDate);
  CREATE TRIGGER reading_logs_insert_guard BEFORE INSERT ON reading_logs WHEN NEW.deletedAt IS NULL BEGIN
    SELECT CASE WHEN NEW.endPage > (SELECT totalPages FROM books WHERE id=NEW.bookId) OR NOT EXISTS (SELECT 1 FROM books WHERE id=NEW.bookId) THEN RAISE(ABORT, 'Invalid book or ending page') END;
    SELECT CASE WHEN EXISTS (SELECT 1 FROM reading_logs WHERE bookId=NEW.bookId AND deletedAt IS NULL AND NEW.startPage < endPage AND NEW.endPage > startPage) THEN RAISE(ABORT, 'Overlapping reading range') END;
  END;
  CREATE TRIGGER reading_logs_update_guard BEFORE UPDATE ON reading_logs WHEN NEW.deletedAt IS NULL BEGIN
    SELECT CASE WHEN NEW.endPage > (SELECT totalPages FROM books WHERE id=NEW.bookId) OR NOT EXISTS (SELECT 1 FROM books WHERE id=NEW.bookId) THEN RAISE(ABORT, 'Invalid book or ending page') END;
    SELECT CASE WHEN EXISTS (SELECT 1 FROM reading_logs WHERE bookId=NEW.bookId AND deletedAt IS NULL AND id != NEW.id AND NEW.startPage < endPage AND NEW.endPage > startPage) THEN RAISE(ABORT, 'Overlapping reading range') END;
  END;
  CREATE TABLE daily_goals (bookId INTEGER NOT NULL REFERENCES books(id), readingDate TEXT NOT NULL, target INTEGER NOT NULL CHECK(target > 0), createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL, syncState TEXT NOT NULL DEFAULT 'pending', PRIMARY KEY(bookId, readingDate));
  CREATE TABLE reading_timers (bookId INTEGER PRIMARY KEY REFERENCES books(id), elapsedMs INTEGER NOT NULL DEFAULT 0, runningSince TEXT, updatedAt TEXT NOT NULL, syncState TEXT NOT NULL DEFAULT 'pending');
  CREATE TABLE reading_reports (id TEXT PRIMARY KEY, bookId INTEGER NOT NULL REFERENCES books(id), readingDate TEXT NOT NULL, reflection TEXT NOT NULL DEFAULT '', status TEXT NOT NULL CHECK(status IN ('draft','ready')), createdAt TEXT NOT NULL, updatedAt TEXT NOT NULL, deletedAt TEXT, syncState TEXT NOT NULL DEFAULT 'pending');`,
  `CREATE TABLE sync_control (id INTEGER PRIMARY KEY CHECK(id=1), suppress INTEGER NOT NULL DEFAULT 0 CHECK(suppress IN (0,1)));
  INSERT INTO sync_control(id) VALUES (1);
  CREATE TABLE sync_identity (entity TEXT NOT NULL, local_key TEXT NOT NULL, cloud_id TEXT NOT NULL UNIQUE, owner_id TEXT, server_revision INTEGER NOT NULL DEFAULT 0, PRIMARY KEY(entity, local_key));
  CREATE TABLE sync_outbox (entity TEXT NOT NULL, local_key TEXT NOT NULL, generation INTEGER NOT NULL, attempts INTEGER NOT NULL DEFAULT 0, next_attempt_at INTEGER NOT NULL DEFAULT 0, last_error TEXT, PRIMARY KEY(entity, local_key));
  CREATE TABLE sync_conflicts (id INTEGER PRIMARY KEY AUTOINCREMENT, entity TEXT NOT NULL, local_key TEXT NOT NULL, remote_payload TEXT NOT NULL, remote_revision INTEGER NOT NULL, created_at TEXT NOT NULL, resolved_at TEXT);
  CREATE TABLE sync_metadata (key TEXT PRIMARY KEY, value TEXT NOT NULL);
  ${['books', 'reading_logs', 'daily_goals', 'reading_reports'].map(table => {
    const key = table === 'books' ? 'CAST(id AS TEXT)' : table === 'daily_goals' ? "CAST(bookId AS TEXT) || ':' || readingDate" : 'id';
    return `INSERT INTO sync_identity(entity,local_key,cloud_id) SELECT '${table}', ${key}, ${uuidSql} FROM ${table};
      INSERT INTO sync_outbox(entity,local_key,generation) SELECT '${table}', ${key}, 1 FROM ${table};`;
  }).join('')}
  ${syncTriggers('books', 'CAST(NEW.id AS TEXT)')}
  ${syncTriggers('reading_logs', 'NEW.id')}
  ${syncTriggers('daily_goals', "CAST(NEW.bookId AS TEXT) || ':' || NEW.readingDate")}
  ${syncTriggers('reading_reports', 'NEW.id')}`,
  `ALTER TABLE books ADD COLUMN pdf TEXT;`,
];
export interface MigrationDatabase {
  getFirstAsync<T>(sql: string): Promise<T | null>;
  execAsync(sql: string): Promise<void>;
  withTransactionAsync(task: () => Promise<void>): Promise<void>;
}
export async function migrate(db: MigrationDatabase) {
  const version = (await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version'))?.user_version ?? 0;
  if (version > migrations.length) throw new Error('This library was created by a newer app version. Please update the app.');
  for (let index = version; index < migrations.length; index++) {
    await db.withTransactionAsync(async () => {
      await db.execAsync(migrations[index]);
      await db.execAsync(`PRAGMA user_version = ${index + 1}`);
    });
  }
}
