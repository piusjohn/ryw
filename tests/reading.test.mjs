import { test } from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { mkdtempSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { migrate } from '../src/storage/migrations.ts';
import { saveBook, listBooks } from '../src/storage/repository.ts';
import { saveLog, deleteLog, readingData, saveReport, getTimer, setTimer } from '../src/storage/reading.ts';
import { elapsed, streak, totalForDate, validateRange } from '../src/features/reading/model.ts';
function adapter(raw) { return {
  async getFirstAsync(sql, ...params) { return raw.prepare(sql).get(...params) ?? null; },
  async getAllAsync(sql, ...params) { return raw.prepare(sql).all(...params).map(row => ({ ...row })); },
  async execAsync(sql) { raw.exec(sql); },
  async runAsync(sql, ...params) { const r = raw.prepare(sql).run(...params); return { lastInsertRowId: Number(r.lastInsertRowid), changes: Number(r.changes) }; },
  async withTransactionAsync(task) { raw.exec('BEGIN'); try { await task(); raw.exec('COMMIT'); } catch (e) { raw.exec('ROLLBACK'); throw e; } },
}; }
test('reading logs, goal snapshots, reports and timers survive database reopen', async () => {
  const folder = mkdtempSync(join(tmpdir(), 'reading-sessions-')); const path = join(folder, 'reading.db'); let raw = new DatabaseSync(path);
  try {
    let db = adapter(raw); await migrate(db);
    const id = await saveBook(db, { title: 'Book', author: '', totalPages: 100, currentPage: 0, dailyTarget: 15, status: 'reading', cover: null });
    let book = (await listBooks(db))[0]; const day = '2026-01-01';
    const first = await saveLog(db, book, { startPage: 0, endPage: 10, readingDate: day, reflection: '' });
    await saveLog(db, book, { startPage: 10, endPage: 15, readingDate: day, reflection: '' });
    let data = await readingData(db); assert.equal(totalForDate(data.logs, day), 15); assert.equal(streak(data.logs, data.goals, day), 1);
    await assert.rejects(saveLog(db, book, { startPage: 0, endPage: 10, readingDate: day, reflection: '' }), /overlap/i);
    await assert.rejects(saveLog(db, book, { startPage: 9, endPage: 11, readingDate: day, reflection: '' }), /overlap/i);
    await assert.rejects(saveLog(db, book, { startPage: 15, endPage: 101, readingDate: day, reflection: '' }), /total pages/i);
    await saveLog(db, book, { id: first, startPage: 0, endPage: 8, readingDate: day, reflection: 'Edited' });
    data = await readingData(db); assert.equal(totalForDate(data.logs, day), 13); assert.equal(streak(data.logs, data.goals, day), 0);
    book = (await listBooks(db))[0]; await saveBook(db, { ...book, dailyTarget: 5 }, id);
    assert.equal((await readingData(db)).goals[0].target, 15);
    await saveReport(db, { bookId: id, readingDate: day, reflection: 'A thought', status: 'draft' });
    await setTimer(db, id, 5000, '2026-01-01T00:00:00.000Z');
    raw.close(); raw = new DatabaseSync(path); db = adapter(raw); await migrate(db); data = await readingData(db);
    assert.equal(data.reports[0].reflection, 'A thought'); assert.equal(data.reports[0].syncState, 'pending');
    assert.equal((await getTimer(db, id)).runningSince, '2026-01-01T00:00:00.000Z');
    assert.equal(elapsed(await getTimer(db, id), Date.parse('2026-01-01T00:00:03Z')), 8000);
    await deleteLog(db, data.logs.find(l => l.id === first)); data = await readingData(db); assert.equal(totalForDate(data.logs, day), 5);
    await deleteLog(db, data.logs[0]); assert.equal((await listBooks(db))[0].currentPage, 0);
  } finally { raw.close(); rmSync(folder, { recursive: true, force: true }); }
});
test('streak counts successful dates once and breaks after a missed day', () => {
  const logs = [{ id: 'a', bookId: 1, startPage: 0, endPage: 10, readingDate: '2026-02-01' }, { id: 'b', bookId: 1, startPage: 10, endPage: 15, readingDate: '2026-02-01' }, { id: 'c', bookId: 1, startPage: 15, endPage: 30, readingDate: '2026-02-02' }];
  const goals = [{ bookId: 1, readingDate: '2026-02-01', target: 15 }, { bookId: 1, readingDate: '2026-02-02', target: 15 }];
  assert.equal(streak(logs, goals, '2026-02-02'), 2); assert.equal(streak(logs, goals, '2026-02-03'), 2); assert.equal(streak(logs, goals, '2026-02-04'), 0);
  assert.match(validateRange(5, 12, 100, logs), /overlap/i); assert.equal(validateRange(30, 35, 100, logs), null);
});
