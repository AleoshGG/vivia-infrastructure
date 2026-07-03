import { useState, useEffect } from 'react';
import { getLessorsByStatusUseCase } from '../../data/di';
import { VerificationsException } from '../../domain/exceptions/VerificationsException';
import type { LessorVerification } from '../../domain/entities/LessorVerification';
import type { VerificationStatus } from '../../domain/objectvalues/VerificationStatus';

interface UseLessorsByStatusState {
  lessors: LessorVerification[];
  loading: boolean;
  error: string | null;
}

export function useLessorsByStatus(status: VerificationStatus): UseLessorsByStatusState {
  const [lessors, setLessors] = useState<LessorVerification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchLessors() {
      setLoading(true);
      setError(null);
      try {
        const data = await getLessorsByStatusUseCase.execute(status);
        if (!cancelled) setLessors(data);
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof VerificationsException
              ? e.message
              : 'Error inesperado al cargar las verificaciones.',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchLessors();

    return () => { cancelled = true; };
  }, [status]);

  return { lessors, loading, error };
}
