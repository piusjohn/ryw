import { useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, TextInput, View } from 'react-native';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import { Button, Card, Copy, Screen, ui } from '@/components/reading-ui';
import { palette as c } from '@/constants/design';
import { coverUri } from '@/storage/covers';
import { useBooks } from './books-provider';
import { emptyFields, statusLabels, toDraft, validateBook, type Book, type BookFields, type BookStatus, type FieldErrors } from './model';

export function BookForm({ book }: { book?: Book }) {
  const { save } = useBooks();
  const [fields, setFields] = useState<BookFields>(() => book ? { title: book.title, author: book.author, totalPages: String(book.totalPages), currentPage: String(book.currentPage), dailyTarget: String(book.dailyTarget), status: book.status } : { ...emptyFields });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [failure, setFailure] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [picking, setPicking] = useState(false);
  const [pickedUri, setPickedUri] = useState<string | null>(null);
  const [cover, setCover] = useState(book?.cover ?? null);
  const locked = useRef(false);
  const change = (key: keyof BookFields, value: string) => { setFields(old => ({ ...old, [key]: value })); setErrors(old => ({ ...old, [key]: undefined })); };
  const pick = async () => {
    setPicking(true); setFailure(null);
    try {
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], allowsEditing: true, aspect: [2, 3], quality: 0.7 });
      if (!result.canceled) setPickedUri(result.assets[0].uri);
    } catch { setFailure('We couldn’t open that photo. Please choose a locally available image and try again. You can also save without a cover.'); }
    finally { setPicking(false); }
  };
  const submit = async () => {
    if (locked.current) return;
    const issues = validateBook(fields); setErrors(issues); setFailure(null);
    if (Object.keys(issues).length) { setFailure('Please check the highlighted fields below.'); return; }
    locked.current = true; setBusy(true);
    try {
      const id = await save(toDraft(fields, cover), book?.id, pickedUri);
      if (book) router.back();
      else router.replace({ pathname: '/books/[id]', params: { id } });
    } catch { setFailure('Your changes couldn’t be saved. Check available device storage and try again. Your form is still here.'); }
    finally { locked.current = false; setBusy(false); }
  };
  const input = (key: Exclude<keyof BookFields, 'status'>, label: string, numeric = false, hint?: string) => <View style={{ gap: 6 }}>
    <Copy style={{ fontWeight: '600' }}>{label}</Copy>
    <TextInput accessibilityLabel={label} accessibilityHint={errors[key] || hint} editable={!busy} value={fields[key]} onChangeText={value => change(key, value)}
      keyboardType={numeric ? 'number-pad' : 'default'} autoCapitalize={numeric ? 'none' : 'sentences'} maxLength={numeric ? 10 : key === 'title' ? 300 : 200}
      style={{ borderWidth: 1, borderColor: errors[key] ? '#A13C33' : c.line, backgroundColor: c.surface, borderRadius: 12, padding: 14, color: c.ink, fontSize: 16, minHeight: 50 }} />
    {hint && <Copy style={{ fontSize: 12, color: c.muted }}>{hint}</Copy>}
    {errors[key] && <Copy accessibilityLiveRegion="polite" style={{ color: '#A13C33' }}>{errors[key]}</Copy>}
  </View>;
  const uri = pickedUri ?? coverUri(cover);
  return <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={96}><Screen>
    <Copy style={ui.title}>{book ? 'Edit your book' : 'A new chapter'}</Copy>
    <Copy style={ui.muted}>Give your reading a little direction. Fields marked * are required.</Copy>
    {failure && <Card><Copy accessibilityRole="alert" style={{ color: '#A13C33' }}>{failure}</Copy></Card>}
    {input('title', 'Book title *')}{input('author', 'Author (optional)')}{input('totalPages', 'Total pages *', true)}
    {input('currentPage', 'Current page *', true, 'Your existing position, not a reading log. Changing this does not count toward daily reading.')}
    {input('dailyTarget', 'Daily page target *', true, 'A plan for each day. Setting a goal does not mark pages as read.')}
    <Copy style={ui.heading}>Reading status</Copy>
    {((book ? ['reading', 'planned', 'completed'] : ['reading', 'planned']) as BookStatus[]).map(status =>
      <Button key={status} disabled={busy} secondary={fields.status !== status} label={`${fields.status === status ? '✓ ' : ''}${statusLabels[status]}`} onPress={() => change('status', status)} />)}
    {errors.status && <Copy accessibilityRole="alert" style={{ color: '#A13C33' }}>{errors.status}</Copy>}
    <Copy style={ui.heading}>Book cover (optional)</Copy>
    {uri && <Image source={{ uri }} contentFit="cover" accessibilityLabel="Selected book cover" style={{ width: 100, height: 150, borderRadius: 8 }} />}
    <Button disabled={busy || picking} secondary label={picking ? 'Opening photos…' : 'Choose from device'} onPress={() => void pick()} />
    {(uri !== null) && <Button disabled={busy || picking} secondary label="Remove cover" onPress={() => { setCover(null); setPickedUri(null); }} />}
    <Button disabled={busy || picking} label={busy ? 'Saving…' : book ? 'Save changes' : 'Add book'} onPress={() => void submit()} />
    <Button disabled={busy} secondary label="Cancel" onPress={() => router.back()} />
  </Screen></KeyboardAvoidingView>;
}
