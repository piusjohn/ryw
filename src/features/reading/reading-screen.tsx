import { useCallback, useEffect, useRef, useState } from 'react';
import { Alert, Modal, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { Button, Card, Copy, Progress, Screen, ui } from '@/components/reading-ui';
import { palette as c } from '@/constants/design';
import { Cover } from '@/features/books/book-card';
import { useBooks } from '@/features/books/books-provider';
import type { Book } from '@/features/books/model';
import { database } from '@/storage/database';
import { deleteLog, deleteReport, getTimer, saveLog, saveReport, setTimer } from '@/storage/reading';
import { elapsed, localDate, pages, totalForDate, type ReadingLog, type Report, type Timer } from './model';
import { useReading } from './use-reading';

const inputStyle = { borderWidth: 1, borderColor: c.line, borderRadius: 12, padding: 12, color: c.ink, minHeight: 48 } as const;
function Field({ label, value, onChangeText, numeric = false, multiline = false, placeholder }: { label: string; value: string; onChangeText: (s: string) => void; numeric?: boolean; multiline?: boolean; placeholder?: string }) {
  return <View style={{ gap: 5 }}><Copy style={{ fontWeight: '600' }}>{label}</Copy><TextInput accessibilityLabel={label} value={value} onChangeText={onChangeText} keyboardType={numeric ? 'number-pad' : 'default'} multiline={multiline} placeholder={placeholder} style={[inputStyle, multiline && { minHeight: 100, textAlignVertical: 'top' }]} /></View>;
}
export function ReadingScreen({ book }: { book: Book }) {
  const { reload } = useBooks(); const { logs, goals, reports, error, refresh } = useReading();
  const [timer, setTimerState] = useState<Timer | null>(null); const [now, setNow] = useState(() => Date.now());
  const [editing, setEditing] = useState<ReadingLog | null>(null); const [logOpen, setLogOpen] = useState(false);
  const [start, setStart] = useState(''); const [end, setEnd] = useState(''); const [date, setDate] = useState(localDate()); const [reflection, setReflection] = useState('');
  const [reportOpen, setReportOpen] = useState(false); const [report, setReport] = useState<Report | null>(null); const [reportDate, setReportDate] = useState(localDate()); const [reportText, setReportText] = useState('');
  const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false); const lock = useRef(false);
  useFocusEffect(useCallback(() => { void database().then(db => getTimer(db, book.id)).then(setTimerState).catch(() => setMessage('Could not load the saved timer.')); }, [book.id]));
  useEffect(() => { if (!timer?.runningSince) return; const interval = setInterval(() => setNow(Date.now()), 1000); return () => clearInterval(interval); }, [timer?.runningSince]);
  const today = localDate(); const target = goals.find(g => g.bookId === book.id && g.readingDate === today)?.target ?? book.dailyTarget;
  const todayPages = totalForDate(logs, today, book.id); const bookLogs = logs.filter(l => l.bookId === book.id); const bookReports = reports.filter(r => r.bookId === book.id);
  const run = async (fn: () => Promise<void>) => { if (lock.current) return; lock.current = true; setBusy(true); setMessage(''); try { await fn(); } catch (e) { setMessage(e instanceof Error ? e.message : 'Something went wrong. Please try again.'); } finally { lock.current = false; setBusy(false); } };
  const changeTimer = (action: 'start' | 'pause' | 'stop') => void run(async () => {
    const value = action === 'stop' ? 0 : elapsed(timer); const runningSince = action === 'start' ? new Date().toISOString() : null;
    await setTimer(await database(), book.id, value, runningSince); setTimerState({ bookId: book.id, elapsedMs: value, runningSince }); setNow(Date.now());
    if (action === 'stop') setMessage('Timer stopped. You can log your pages whenever you’re ready.');
  });
  const openLog = (log?: ReadingLog) => { setEditing(log ?? null); setStart(String(log?.startPage ?? book.currentPage)); setEnd(log ? String(log.endPage) : ''); setDate(log?.readingDate ?? localDate()); setReflection(log?.reflection ?? ''); setLogOpen(true); setMessage(''); };
  const openReport = (day: string, existing?: Report, text = '') => { setReport(existing ?? null); setReportDate(day); setReportText(existing?.reflection ?? text); setReportOpen(true); };
  const save = () => void run(async () => {
    if (!/^\d+$/.test(start) || !/^\d+$/.test(end)) throw new Error('Enter whole starting and ending pages.');
    await saveLog(await database(), book, { id: editing?.id, startPage: Number(start), endPage: Number(end), readingDate: date, reflection });
    await Promise.all([refresh(), reload()]); setLogOpen(false); setMessage('Reading saved locally.'); if (!editing) openReport(date, undefined, reflection);
  });
  const saveDraft = (status: 'draft' | 'ready') => void run(async () => { await saveReport(await database(), { id: report?.id, bookId: book.id, readingDate: reportDate, reflection: reportText, status }); await refresh(); setReportOpen(false); setMessage(status === 'ready' ? 'Report marked ready and saved locally.' : 'Report draft saved locally.'); });
  const confirmDelete = (kind: 'log' | 'report', item: ReadingLog | Report) => Alert.alert(`Delete ${kind}?`, 'This change is saved on this device.', [{ text: 'Cancel', style: 'cancel' }, { text: 'Delete', style: 'destructive', onPress: () => void run(async () => { if (kind === 'log') { await deleteLog(await database(), item as ReadingLog); await reload(); } else await deleteReport(await database(), item.id); await refresh(); setMessage(`${kind === 'log' ? 'Reading log' : 'Draft'} deleted locally.`); }) }]);
  const seconds = Math.floor(elapsed(timer, now) / 1000); const clock = `${String(Math.floor(seconds / 3600)).padStart(2, '0')}:${String(Math.floor(seconds / 60) % 60).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  const reportLogs = bookLogs.filter(l => l.readingDate === reportDate);
  return <Screen><Copy style={ui.eyebrow}>YOUR READING SESSION</Copy><View style={{ flexDirection: 'row', gap: 16 }}><Cover book={book} /><View style={{ flex: 1, gap: 6 }}><Copy style={ui.heading}>{book.title}</Copy><Copy style={ui.muted}>{book.author || 'Author not specified'}</Copy><Copy>Page {book.currentPage} of {book.totalPages}</Copy><Copy>{Math.round(book.currentPage / book.totalPages * 100)}% complete</Copy></View></View>
    <Progress value={book.currentPage / book.totalPages} label="Book completion" />
    <Card style={{ backgroundColor: c.lemon, borderColor: c.lemon }}><Copy style={{ color: c.accent }}>TODAY’S READING</Copy><Copy style={{ color: c.ink, fontSize: 30, fontWeight: '700' }}>{todayPages} / {target} pages</Copy><Progress value={todayPages / target} label="Daily progress" inverted /><Copy style={{ color: c.ink }}>{todayPages >= target ? 'Daily goal met. Well done!' : `${Math.max(0, target - todayPages)} pages to your goal`}</Copy></Card>
    <Card style={{ alignItems: 'center' }}><Copy style={ui.eyebrow}>OPTIONAL TIMER</Copy><Copy style={{ fontSize: 42, lineHeight: 52, fontWeight: '700', color: c.accent }}>{clock}</Copy><Copy style={ui.muted}>{timer?.runningSince ? 'Reading in progress' : 'Take your time. Every page counts.'}</Copy><View style={{ flexDirection: 'row', gap: 10 }}><Button label={timer?.runningSince ? 'Pause' : 'Start'} disabled={busy} onPress={() => changeTimer(timer?.runningSince ? 'pause' : 'start')} /><Button label="Stop" secondary disabled={busy} onPress={() => changeTimer('stop')} /></View></Card>
    <Button label="Log Reading" onPress={() => openLog()} /><Copy style={{ textAlign: 'center', color: c.muted }}>Saved locally · Not synced</Copy>{!!(message || error) && <Copy accessibilityRole="alert">{message || error}</Copy>}
    <Copy style={ui.heading}>Reading history</Copy>{bookLogs.length === 0 && <Copy style={ui.muted}>Your reading sessions will appear here.</Copy>}{bookLogs.map(log => <Card key={log.id}><Copy style={ui.heading}>{pages(log)} pages · {log.readingDate}</Copy><Copy>Pages {log.startPage} → {log.endPage}</Copy>{!!log.reflection && <Copy>{log.reflection}</Copy>}<View style={{ flexDirection: 'row', gap: 10 }}><Button label="Edit" secondary onPress={() => openLog(log)} /><Button label="Delete" secondary onPress={() => confirmDelete('log', log)} /></View></Card>)}
    <Copy style={ui.heading}>Reading reports</Copy>{bookLogs.length > 0 && <Button label="Write a report for today" secondary onPress={() => openReport(today)} />}{bookReports.length === 0 && <Copy style={ui.muted}>Save a reflection after logging your reading.</Copy>}{bookReports.map(r => <Card key={r.id}><Copy style={ui.heading}>{r.readingDate} · {r.status === 'ready' ? 'Ready' : 'Draft'}</Copy><Copy>{totalForDate(logs, r.readingDate, book.id)} pages · Saved locally · Not synced</Copy><Copy>{r.reflection || 'No reflection yet.'}</Copy><View style={{ flexDirection: 'row', gap: 10 }}><Button label="View / Edit" secondary onPress={() => openReport(r.readingDate, r)} />{r.status === 'draft' && <Button label="Delete" secondary onPress={() => confirmDelete('report', r)} />}</View></Card>)}
    <Modal visible={logOpen} animationType="slide" onRequestClose={() => setLogOpen(false)}><Screen><Copy style={ui.title}>{editing ? 'Edit reading' : 'Log reading'}</Copy><Copy style={ui.muted}>{book.title} · Saved locally</Copy><Field label="Starting page (last completed)" value={start} onChangeText={setStart} numeric /><Field label="Ending page (last completed)" value={end} onChangeText={setEnd} numeric /><Copy>Pages read: {/^\d+$/.test(start) && /^\d+$/.test(end) ? Math.max(0, Number(end) - Number(start)) : 0}</Copy><Field label="Reading date (YYYY-MM-DD)" value={date} onChangeText={setDate} /><Field label="Key takeaway or reflection (optional)" value={reflection} onChangeText={setReflection} multiline />{!!message && <Copy accessibilityRole="alert">{message}</Copy>}<Button label={busy ? 'Saving…' : 'Save reading'} disabled={busy} onPress={save} /><Button label="Cancel" secondary onPress={() => setLogOpen(false)} /></Screen></Modal>
    <Modal visible={reportOpen} animationType="slide" onRequestClose={() => setReportOpen(false)}><Screen><Copy style={ui.title}>Your reading report</Copy><Copy style={ui.muted}>A moment to reflect, saved on this device.</Copy><Card><Copy style={ui.heading}>{book.title}</Copy><Copy>{reportDate} · {totalForDate(logs, reportDate, book.id)} pages</Copy>{reportLogs.map(l => <Copy key={l.id}>Pages {l.startPage} → {l.endPage}</Copy>)}<Copy>{reportText || 'Your reflection will appear here.'}</Copy></Card><Field label="Reflection" value={reportText} onChangeText={setReportText} multiline placeholder="What did you learn from today's reading?" />{!!message && <Copy accessibilityRole="alert">{message}</Copy>}<Button label="Save draft" disabled={busy} onPress={() => saveDraft('draft')} /><Button label="Mark ready for future submission" secondary disabled={busy} onPress={() => saveDraft('ready')} /><Button label="Close" secondary onPress={() => setReportOpen(false)} /><Copy style={ui.muted}>Saved locally · Not synced or submitted</Copy></Screen></Modal>
  </Screen>;
}
