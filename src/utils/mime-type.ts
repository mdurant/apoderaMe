const mimeByExtension: Record<string, string> = {
  pdf: 'application/pdf',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
};

export function inferMimeType(fileName: string, mimeType?: string | null) {
  if (mimeType && mimeType.length > 0) {
    return mimeType;
  }

  const extension = fileName.split('.').pop()?.toLowerCase() ?? '';
  return mimeByExtension[extension] ?? '';
}

export function isAllowedReceiptMime(mimeType: string) {
  return mimeType === 'application/pdf' || mimeType === 'image/jpeg' || mimeType === 'image/png';
}
