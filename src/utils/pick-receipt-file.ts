import { inferMimeType, isAllowedReceiptMime } from '@/utils/mime-type';

export type PickedReceiptFile = {
  uri: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  file?: Blob;
};

/** Resolución por defecto (web/tooling). Nativo usa pick-receipt-file.native.ts. */
export function pickReceiptFile(): Promise<PickedReceiptFile | null> {
  if (typeof document === 'undefined') {
    return Promise.resolve(null);
  }

  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'application/pdf,image/jpeg,image/png,.pdf,.jpg,.jpeg,.png';
    input.style.display = 'none';

    let settled = false;

    const finish = (value: PickedReceiptFile | null) => {
      if (settled) return;
      settled = true;
      input.remove();
      resolve(value);
    };

    input.addEventListener('change', () => {
      const file = input.files?.[0];
      if (!file) {
        finish(null);
        return;
      }

      const mimeType = inferMimeType(file.name, file.type);
      if (!isAllowedReceiptMime(mimeType)) {
        finish(null);
        window.alert('Solo se permiten archivos PDF, JPEG o PNG.');
        return;
      }

      finish({
        uri: URL.createObjectURL(file),
        name: file.name,
        mimeType,
        sizeBytes: file.size,
        file,
      });
    });

    const onWindowFocus = () => {
      window.setTimeout(() => {
        if (!input.files?.length) {
          finish(null);
        }
        window.removeEventListener('focus', onWindowFocus);
      }, 300);
    };

    window.addEventListener('focus', onWindowFocus);
    document.body.appendChild(input);
    input.click();
  });
}
