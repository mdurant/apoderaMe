import * as DocumentPicker from 'expo-document-picker';

import { inferMimeType, isAllowedReceiptMime } from '@/utils/mime-type';

import type { PickedReceiptFile } from './pick-receipt-file';

export type { PickedReceiptFile };

export async function pickReceiptFile(): Promise<PickedReceiptFile | null> {
  const picked = await DocumentPicker.getDocumentAsync({
    type: ['application/pdf', 'image/jpeg', 'image/png'],
    copyToCacheDirectory: true,
    multiple: false,
    base64: false,
  });

  if (picked.canceled || !picked.assets?.[0]) {
    return null;
  }

  const asset = picked.assets[0];
  const mimeType = inferMimeType(asset.name ?? 'comprobante.pdf', asset.mimeType);

  if (!isAllowedReceiptMime(mimeType)) {
    throw new Error('Solo se permiten archivos PDF, JPEG o PNG.');
  }

  return {
    uri: asset.uri,
    name: asset.name ?? 'comprobante',
    mimeType,
    sizeBytes: asset.size ?? 0,
    file: asset.file ?? undefined,
  };
}
