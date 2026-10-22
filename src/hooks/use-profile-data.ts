import { useCallback, useEffect, useState } from 'react';

import type { SchoolSummary, Student } from '@/domain/models';
import { listLinkedStudents, loadPrimarySchool } from '@/repositories/profiles';
import { useSession } from '@/components/session-provider';
import { demoSchool, demoStudents } from '@/data/demo';

type ProfileDataState = {
  students: Student[];
  school: SchoolSummary | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

export function useProfileData(): ProfileDataState {
  const { session } = useSession();
  const [students, setStudents] = useState<Student[]>([]);
  const [school, setSchool] = useState<SchoolSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    await Promise.resolve();

    if (!session) {
      setStudents([]);
      setSchool(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      if (session.mode === 'demo') {
        setStudents(session.account.access === 'apoderado' ? demoStudents : []);
        setSchool({ ...demoSchool });
        return;
      }

      const [linkedStudents, primarySchool] = await Promise.all([
        listLinkedStudents(session.mode, session.account.access),
        loadPrimarySchool(session.mode, session.account.access),
      ]);

      setStudents(linkedStudents);
      setSchool(primarySchool);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'No se pudo cargar el perfil');
      setStudents([]);
      setSchool(null);
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

  return { students, school, loading, error, refresh };
}
