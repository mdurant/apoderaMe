const RUT_CLEANUP = /[^0-9kK]/g;

export function cleanRut(value: string) {
  return value.replace(RUT_CLEANUP, '').toUpperCase();
}

export function calculateRutCheckDigit(body: string) {
  let sum = 0;
  let multiplier = 2;

  for (let index = body.length - 1; index >= 0; index -= 1) {
    sum += Number(body[index]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }

  const result = 11 - (sum % 11);
  if (result === 11) return '0';
  if (result === 10) return 'K';
  return String(result);
}

export function isValidRut(value: string) {
  const cleaned = cleanRut(value);
  if (cleaned.length < 8 || cleaned.length > 9) return false;

  const body = cleaned.slice(0, -1);
  const checkDigit = cleaned.slice(-1);

  return /^\d+$/.test(body) && calculateRutCheckDigit(body) === checkDigit;
}

export function formatRut(value: string) {
  const cleaned = cleanRut(value);
  if (cleaned.length < 2) return cleaned;

  const body = cleaned.slice(0, -1);
  const checkDigit = cleaned.slice(-1);
  const formattedBody = Number(body).toLocaleString('es-CL');

  return `${formattedBody}-${checkDigit}`;
}

export function maskRut(value: string) {
  return isValidRut(value) ? '**.***.***-*' : '';
}

export function formatClp(value: number) {
  return new Intl.NumberFormat('es-CL', {
    style: 'currency',
    currency: 'CLP',
    maximumFractionDigits: 0,
  }).format(value);
}

function parseChileDate(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return new Date(`${value}T12:00:00Z`);
  }

  return new Date(value);
}

export function formatChileDate(value: string, options?: Intl.DateTimeFormatOptions) {
  return new Intl.DateTimeFormat('es-CL', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'America/Santiago',
    ...options,
  }).format(parseChileDate(value));
}

export function formatChileDateTime(value: string) {
  return new Intl.DateTimeFormat('es-CL', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Santiago',
  }).format(parseChileDate(value));
}
