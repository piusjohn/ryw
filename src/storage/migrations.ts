// Each migration and its version update are committed in the same transaction.
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
