import { useCallback, useEffect, useState } from 'react';

import type { FeeWithStudent } from '@/domain/models';
import { listFeesWithStudents } from '@/repositories/fees';
import { useSession } from '@/components/session-provider';

type FeesState = {
  fees: FeeWithStudent[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export function useFees(): FeesState {
  const { session } = useSession();
  const [fees, setFees] = useState<FeeWithStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    await Promise.resolve();

    if (!session) {
      setFees([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const nextFees = await listFeesWithStudents(session.mode);
      setFees(nextFees);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudieron cargar las cuotas');
      setFees([]);
    } finally {
      setLoading(false);
    }
  }, [session]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      void refresh();
    }, 0);

    return () => clearTimeout(timeout);
  }, [refresh]);

  return { fees, loading, error, refresh };
}
