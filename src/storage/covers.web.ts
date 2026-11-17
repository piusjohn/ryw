// On web the image is embedded in the SQLite row, never a temporary blob URL.
export const coverUri = (cover: string | null): string | null => cover;
export async function storeCover(uri: string): Promise<string> {
  if (!uri.startsWith('blob:') && !uri.startsWith('data:')) throw new Error('Choose a local image.');
  const blob = await (await fetch(uri)).blob();
  if (blob.size > 10 * 1024 * 1024) throw new Error('Cover is too large.');
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read image.'));
    reader.readAsDataURL(blob);
  });
}
export async function removeCover(_cover: string): Promise<void> {
  // Replacing the SQLite column releases the old image; no separate file exists.
}
