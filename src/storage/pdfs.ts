import { Directory, File, Paths } from 'expo-file-system';
import * as Sharing from 'expo-sharing';
const directory = () => new Directory(Paths.document, 'book-pdfs');
export async function storePdf(uri: string): Promise<string> {
  const folder = directory(); folder.create({ idempotent: true, intermediates: true });
  const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.pdf`;
  new File(uri).copy(new File(folder, name));
  return name;
}
export async function removePdf(name: string) { const file = new File(directory(), name); if (file.exists) file.delete(); }
export async function openPdf(name: string) {
  const file = new File(directory(), name);
  if (!file.exists) throw new Error('This PDF is no longer available on this device. Add it again from Edit book.');
  if (!await Sharing.isAvailableAsync()) throw new Error('No compatible way to open this PDF is available on this device.');
  await Sharing.shareAsync(file.uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf', dialogTitle: 'Open PDF with' });
}
