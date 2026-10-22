import { useCallback, useEffect, useState } from 'react';

import type { PendingPaymentReview } from '@/domain/models';
import { listPendingPayments } from '@/repositories/payments';
import { useSession } from '@/components/session-provider';

type PendingPaymentsState = {
  payments: PendingPaymentReview[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export function usePendingPayments(): PendingPaymentsState {
  const { session } = useSession();
  const [payments, setPayments] = useState<PendingPaymentReview[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    await Promise.resolve();

    if (!session || session.account.access !== 'directiva') {
      setPayments([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const nextPayments = await listPendingPayments(session.mode);
      setPayments(nextPayments);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudieron cargar los pagos');
      setPayments([]);
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

  return { payments, loading, error, refresh };
}
