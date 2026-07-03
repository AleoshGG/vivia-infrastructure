import { useState, useEffect } from 'react';
import { getLessorDetailUseCase } from '../../data/di';
import { VerificationsException } from '../../domain/exceptions/VerificationsException';
import type { LessorVerificationDetail } from '../../domain/entities/LessorVerificationDetail';

interface UseLessorDetailState {
  detail: LessorVerificationDetail | null;
  loading: boolean;
  error: string | null;
}

export function useLessorDetail(id: string | undefined): UseLessorDetailState {
  const [detail, setDetail] = useState<LessorVerificationDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError('Verificación no especificada.');
      return;
    }

    let cancelled = false;

    async function fetchDetail() {
      setLoading(true);
      setError(null);
      try {
        const data = await getLessorDetailUseCase.execute(id!);
        if (!cancelled) setDetail(data);
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof VerificationsException
              ? e.message
              : 'Error inesperado al cargar el detalle de la verificación.',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchDetail();

    return () => { cancelled = true; };
  }, [id]);

  return { detail, loading, error };
}
