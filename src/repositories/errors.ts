export class RepositoryError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'RepositoryError';
  }
}

export function toRepositoryError(error: unknown, fallback: string) {
  if (error instanceof RepositoryError) return error;
  if (error && typeof error === 'object') {
    const record = error as Record<string, unknown>;
    const parts = [record.message, record.details, record.hint, record.code]
      .filter((value) => typeof value === 'string' && value.length > 0)
      .map(String);

    if (parts.length > 0) {
      return new RepositoryError(`${fallback}: ${parts.join(' · ')}`, error);
    }
  }
  if (error && typeof error === 'object' && 'message' in error) {
    return new RepositoryError(`${fallback}: ${String(error.message)}`, error);
  }
  return new RepositoryError(fallback, error);
}
