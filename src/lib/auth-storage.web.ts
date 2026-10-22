import type { SupportedStorage } from '@supabase/supabase-js';

function createMemoryStorage(): SupportedStorage {
  const store = new Map<string, string>();

  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, value);
    },
    removeItem: (key) => {
      store.delete(key);
    },
  };
}

/**
 * En web usamos localStorage nativo del navegador.
 * Durante render estático (sin window) caemos a memoria hasta hidratar.
 */
export const authStorage: SupportedStorage =
  typeof window !== 'undefined' && window.localStorage
    ? window.localStorage
    : createMemoryStorage();
