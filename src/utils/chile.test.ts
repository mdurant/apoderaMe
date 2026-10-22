import { describe, expect, it } from 'vitest';

import {
  calculateRutCheckDigit,
  cleanRut,
  formatChileDate,
  formatClp,
  formatRut,
  isValidRut,
  maskRut,
} from './chile';

describe('utilidades chilenas', () => {
  it('limpia y formatea un RUT chileno', () => {
    expect(cleanRut('17.654.321-3')).toBe('176543213');
    expect(formatRut('176543213')).toBe('17.654.321-3');
    expect(maskRut('17.654.321-3')).toBe('**.***.***-*');
  });

  it('calcula y valida el dígito verificador', () => {
    expect(calculateRutCheckDigit('17654321')).toBe('3');
    expect(isValidRut('17.654.321-3')).toBe(true);
    expect(isValidRut('17.654.321-4')).toBe(false);
    expect(isValidRut('12.345.678-5')).toBe(true);
  });

  it('rechaza entradas que no tienen estructura de RUT', () => {
    expect(isValidRut('')).toBe(false);
    expect(isValidRut('123-4')).toBe(false);
    expect(isValidRut('correo@ejemplo.invalid')).toBe(false);
  });

  it('formatea montos como pesos chilenos sin decimales', () => {
    const value = formatClp(12345);
    expect(value).toContain('$');
    expect(value).toContain('12.345');
  });

  it('interpreta fechas usando la zona horaria de Chile', () => {
    expect(formatChileDate('2026-07-29T09:00:00-04:00')).toContain('29');
    expect(formatChileDate('2026-07-29T09:00:00-04:00')).toContain('jul');
    expect(formatChileDate('2026-07-31')).toContain('31');
  });
});
