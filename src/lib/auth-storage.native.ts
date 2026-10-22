import 'expo-sqlite/localStorage/install';

import type { SupportedStorage } from '@supabase/supabase-js';

/** Polyfill de localStorage respaldado por SQLite en iOS/Android. */
export const authStorage: SupportedStorage = localStorage;
