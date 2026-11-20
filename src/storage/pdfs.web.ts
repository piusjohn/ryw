export async function storePdf(uri: string): Promise<string> {
  if (!uri.startsWith('blob:') && !uri.startsWith('data:')) throw new Error('Choose a local PDF.');
  const blob = await (await fetch(uri)).blob();
  if (blob.size > 15 * 1024 * 1024) throw new Error('Please choose a PDF smaller than 15 MB on the web.');
  return new Promise((resolve, reject) => {
    const reader = new FileReader(); reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error('Could not read this PDF.')); reader.readAsDataURL(blob);
  });
}
export async function removePdf(_pdf: string): Promise<void> {}
export async function openPdf(pdf: string) {
  const response = await fetch(pdf); const blob = await response.blob(); const url = URL.createObjectURL(blob);
  const link = document.createElement('a'); link.href = url; link.target = '_blank'; link.rel = 'noopener'; link.click();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
}
