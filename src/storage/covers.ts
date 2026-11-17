import { Directory, File, Paths } from 'expo-file-system';
const directory = () => new Directory(Paths.document, 'book-covers');
export function coverUri(name: string | null): string | null {
  return name ? new File(directory(), name).uri : null;
}
export async function storeCover(uri: string): Promise<string> {
  const folder = directory();
  await folder.create({ idempotent: true, intermediates: true });
  const extension = uri.split('?')[0].match(/\.(jpg|jpeg|png|webp|heic)$/i)?.[1] ?? 'jpg';
  const name = `${Date.now()}-${Math.random().toString(36).slice(2)}.${extension}`;
  await new File(uri).copy(new File(folder, name));
  return name;
}
export async function removeCover(name: string) {
  const file = new File(directory(), name);
  if (file.exists) await file.delete();
}
