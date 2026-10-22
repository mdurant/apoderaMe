import {
  createContext,
  type PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import { demoAccounts } from '@/data/demo';
import type { AppSession } from '@/domain/models';
import { isSupabaseConfigured, supabase } from '@/lib/supabase';
import { loadAppAccount } from '@/repositories/profiles';
import { RepositoryError } from '@/repositories/errors';

type SessionContextValue = {
  session: AppSession | null;
  isLoading: boolean;
  isSupabaseEnabled: boolean;
  signInDemo: (accountId: string) => void;
  signInWithPassword: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: PropsWithChildren) {
  const [session, setSession] = useState<AppSession | null>(null);
  const [isLoading, setIsLoading] = useState(isSupabaseConfigured);

  const hydrateSupabaseSession = useCallback(async () => {
    await Promise.resolve();
    if (!supabase) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);

    try {
      const {
        data: { session: authSession },
      } = await supabase.auth.getSession();

      if (!authSession?.user) {
        setSession(null);
        return;
      }

      const account = await loadAppAccount(authSession.user.id);
      setSession({ mode: 'supabase', account });
    } catch {
      setSession(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!supabase) {
      return;
    }

    const timeout = setTimeout(() => {
      void hydrateSupabaseSession();
    }, 0);

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, authSession) => {
      if (!authSession?.user) {
        setSession(null);
        setIsLoading(false);
        return;
      }

      void loadAppAccount(authSession.user.id)
        .then((account) => {
          setSession({ mode: 'supabase', account });
        })
        .catch(() => {
          setSession(null);
        })
        .finally(() => {
          setIsLoading(false);
        });
    });

    return () => {
      clearTimeout(timeout);
      subscription.unsubscribe();
    };
  }, [hydrateSupabaseSession]);

  const value = useMemo<SessionContextValue>(
    () => ({
      session,
      isLoading,
      isSupabaseEnabled: isSupabaseConfigured,
      signInDemo: (accountId) => {
        const account = demoAccounts.find((item) => item.id === accountId);
        if (!account) throw new Error('Cuenta demo no encontrada');
        setSession({ mode: 'demo', account });
      },
      signInWithPassword: async (email, password) => {
        if (!supabase) {
          throw new RepositoryError('Supabase no está configurado');
        }

        const normalizedEmail = email.trim().toLowerCase();
        const { error } = await supabase.auth.signInWithPassword({
          email: normalizedEmail,
          password,
        });

        if (error) {
          throw new RepositoryError('No se pudo iniciar sesión. Revisa correo y contraseña.', error);
        }
      },
      signOut: async () => {
        if (session?.mode === 'supabase' && supabase) {
          await supabase.auth.signOut();
        }
        setSession(null);
      },
    }),
    [isLoading, session],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession() {
  const context = useContext(SessionContext);

  if (!context) {
    throw new Error('useSession debe utilizarse dentro de SessionProvider');
  }

  return context;
}
