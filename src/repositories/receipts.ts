import type { FeeWithStudent } from '@/domain/models';
import { getSupabase } from '@/lib/supabase';
import { RepositoryError, toRepositoryError } from '@/repositories/errors';
import { inferMimeType, isAllowedReceiptMime } from '@/utils/mime-type';

const RECEIPTS_BUCKET = 'payment-receipts';

const extensionByMime: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'application/pdf': 'pdf',
};

function randomUuid() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = Math.floor(Math.random() * 16);
    const value = char === 'x' ? random : (random & 0x3) | 0x8;
    return value.toString(16);
  });
}

export function buildReceiptStoragePath(
  fee: Pick<FeeWithStudent, 'schoolId' | 'courseId'>,
  paymentId: string,
  mimeType: string,
) {
  const extension = extensionByMime[mimeType];
  if (!extension) {
    throw new RepositoryError('Tipo de archivo no permitido');
  }

  return `${fee.schoolId}/${fee.courseId}/${paymentId}/${randomUuid()}.${extension}`;
}

async function readUploadBody(fileUri: string, file?: Blob) {
  if (file) {
    return file;
  }

  const response = await fetch(fileUri);
  if (!response.ok) {
    throw new RepositoryError('No se pudo leer el comprobante seleccionado');
  }
  return response.blob();
}

async function resolveSizeBytes(sizeBytes: number, body: Blob) {
  if (sizeBytes > 0) {
    return sizeBytes;
  }
  return body.size;
}

export async function submitPaymentWithReceipt(
  mode: 'demo' | 'supabase',
  input: {
    fee: FeeWithStudent;
    paymentId: string;
    userId: string;
    fileUri: string;
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    file?: Blob;
  },
) {
  if (mode === 'demo') {
    return input.paymentId;
  }

  const normalizedMime = inferMimeType(input.fileName, input.mimeType);
  if (!isAllowedReceiptMime(normalizedMime)) {
    throw new RepositoryError('Solo se permiten archivos JPEG, PNG o PDF');
  }

  try {
    const client = getSupabase();
    const body = await readUploadBody(input.fileUri, input.file);
    const resolvedSize = await resolveSizeBytes(input.sizeBytes, body);

    if (resolvedSize <= 0 || resolvedSize > 10_485_760) {
      throw new RepositoryError('El comprobante debe pesar entre 1 byte y 10 MB');
    }

    const storagePath = buildReceiptStoragePath(input.fee, input.paymentId, normalizedMime);

    const { error: uploadError } = await client.storage
      .from(RECEIPTS_BUCKET)
      .upload(storagePath, body, {
        contentType: normalizedMime,
        upsert: false,
      });

    if (uploadError) {
      throw new RepositoryError(
        uploadError.message || 'No se pudo subir el comprobante',
        uploadError,
      );
    }

    const { error: receiptError } = await client.from('receipts').insert({
      payment_id: input.paymentId,
      storage_path: storagePath,
      mime_type: normalizedMime,
      size_bytes: resolvedSize,
      uploaded_by: input.userId,
    });

    if (receiptError) {
      await client.storage.from(RECEIPTS_BUCKET).remove([storagePath]);
      throw new RepositoryError(
        receiptError.message || 'No se pudo registrar el comprobante',
        receiptError,
      );
    }

    return storagePath;
  } catch (error) {
    throw toRepositoryError(error, 'Error al enviar comprobante');
  }
}

export async function createSignedReceiptUrl(mode: 'demo' | 'supabase', storagePath: string) {
  if (mode === 'demo') {
    return null;
  }

  try {
    const client = getSupabase();
    const { data, error } = await client.storage
      .from(RECEIPTS_BUCKET)
      .createSignedUrl(storagePath, 120);

    if (error) {
      throw new RepositoryError('No se pudo generar la URL del comprobante', error);
    }

    return data.signedUrl;
  } catch (error) {
    throw toRepositoryError(error, 'Error al firmar URL del comprobante');
  }
}
