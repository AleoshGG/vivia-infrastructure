import { useState } from 'react';
import { resolveReportUseCase } from '../../data/di';
import { ReportsException } from '../../domain/exceptions/ReportsException';
import type { ReportVerdict } from '../../domain/objectvalues/ReportVerdict';

interface UseResolveReportState {
  resolve: (id: string, verdict: ReportVerdict) => Promise<boolean>;
  submitting: boolean;
  error: string | null;
}

export function useResolveReport(): UseResolveReportState {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resolve = async (id: string, verdict: ReportVerdict): Promise<boolean> => {
    setSubmitting(true);
    setError(null);
    try {
      await resolveReportUseCase.execute(id, verdict);
      return true;
    } catch (e) {
      setError(
        e instanceof ReportsException
          ? e.message
          : 'Error inesperado al aplicar el veredicto.',
      );
      return false;
    } finally {
      setSubmitting(false);
    }
  };

  return { resolve, submitting, error };
}
