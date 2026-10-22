import { describe, expect, it } from 'vitest';

import { inferMimeType, isAllowedReceiptMime } from './mime-type';

describe('mime-type', () => {
  it('infiere PDF cuando el navegador no entrega mimeType', () => {
    expect(inferMimeType('comprobante.pdf', '')).toBe('application/pdf');
  });

  it('acepta png por extensión', () => {
    expect(inferMimeType('foto.png', '')).toBe('image/png');
    expect(isAllowedReceiptMime('image/png')).toBe(true);
  });
});
