import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { emptyFields, validateBook, toDraft, remainingDays } from '../src/features/books/model.ts';
import { migrate } from '../src/storage/migrations.ts';
import { saveBook, listBooks } from '../src/storage/repository.ts';

const fields = { ...emptyFields, title: '  My Book  ', totalPages: '101', dailyTarget: '20' };
test('valid input trims text, defaults to page zero, and keeps author optional', () => {
  assert.deepEqual(validateBook(fields), {});
  assert.equal(toDraft(fields, null).title, 'My Book');
  assert.equal(toDraft(fields, null).currentPage, 0);
  assert.equal(toDraft(fields, null).author, '');
});
for (const value of ['', '0', '-2', '1.5', '1e3', 'NaN', 'Infinity', '99999999999999999', '2147483648']) {
  test(`rejects invalid positive integer: ${JSON.stringify(value)}`, () => {
    for (const key of ['dailyTarget', 'totalPages']) assert.ok(validateBook({ ...fields, [key]: value })[key]);
  });
}
test('validates title, bounded current page, and completion without silently adding progress', () => {
  assert.ok(validateBook({ ...fields, title: ' ' }).title);
  for (const currentPage of ['-1', '102', '1.2', '']) assert.ok(validateBook({ ...fields, currentPage }).currentPage);
  assert.ok(validateBook({ ...fields, status: 'completed' }).status);
  assert.deepEqual(validateBook({ ...fields, currentPage: '101', status: 'completed' }), {});
});
test('remaining days round up, handle completion, and respond to target changes', () => {
  const book = toDraft(fields, null);
  assert.equal(remainingDays(book), 6);
  assert.equal(remainingDays({ ...book, currentPage: 100 }), 1);
  assert.equal(remainingDays({ ...book, currentPage: 101 }), 0);
  assert.equal(remainingDays({ ...book, dailyTarget: 200 }), 1);
});
function adapter(raw) {
  return {
    async getFirstAsync(sql) { return raw.prepare(sql).get() ?? null; },
    async getAllAsync(sql) { return raw.prepare(sql).all().map(row => ({ ...row })); },
    async execAsync(sql) { raw.exec(sql); },
    async runAsync(sql, ...params) { const result = raw.prepare(sql).run(...params); return { lastInsertRowId: Number(result.lastInsertRowid), changes: Number(result.changes) }; },
    async withTransactionAsync(task) {
      raw.exec('BEGIN');
      try { await task(); raw.exec('COMMIT'); }
      catch (error) { raw.exec('ROLLBACK'); throw error; }
    },
  };
}
test('SQLite migrations, add/edit, bound SQL, and persistence after closing and reopening', async () => {
  const folder = mkdtempSync(join(tmpdir(), 'reading-books-'));
  const path = join(folder, 'library.db');
  let raw = new DatabaseSync(path);
  try {
    let db = adapter(raw);
    await migrate(db); await migrate(db);
    assert.equal(raw.prepare('PRAGMA user_version').get().user_version, 1);
    const draft = toDraft({ ...fields, title: "Reader's book'); DROP TABLE books;--" }, 'cover.jpg');
    const id = await saveBook(db, draft);
    await saveBook(db, { ...draft, dailyTarget: 10, status: 'planned' }, id);
    raw.close(); raw = new DatabaseSync(path); db = adapter(raw); await migrate(db);
    const [book] = await listBooks(db);
    assert.equal(book.title, draft.title); assert.equal(book.currentPage, 0);
    assert.equal(book.dailyTarget, 10); assert.equal(book.status, 'planned'); assert.equal(book.cover, 'cover.jpg');
    await saveBook(db, { ...book, currentPage: 101, status: 'completed' }, id);
    assert.equal((await listBooks(db))[0].status, 'completed');
    await assert.rejects(saveBook(db, { ...draft, dailyTarget: 0 }));
    await assert.rejects(saveBook(db, { ...draft, currentPage: 102 }));
    await assert.rejects(saveBook(db, { ...draft, status: 'completed' }));
    await assert.rejects(saveBook(db, draft, 99999));
    assert.equal((await listBooks(db)).length, 1);
  } finally { raw.close(); rmSync(folder, { recursive: true, force: true }); }
});
test('failed migration rolls back schema and version; newer databases are refused', async () => {
  const raw = new DatabaseSync(':memory:');
  try {
    const db = adapter(raw);
    const original = db.execAsync;
    db.execAsync = async sql => { if (sql.startsWith('PRAGMA user_version =')) throw new Error('simulated failure'); await original(sql); };
    await assert.rejects(migrate(db));
    assert.equal(raw.prepare('PRAGMA user_version').get().user_version, 0);
    assert.equal(raw.prepare("SELECT count(*) as count FROM sqlite_master WHERE name='books'").get().count, 0);
    raw.exec('PRAGMA user_version = 99');
    await assert.rejects(migrate(adapter(raw)), /newer app/);
  } finally { raw.close(); }
});
