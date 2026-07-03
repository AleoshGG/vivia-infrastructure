import { useState, useEffect } from 'react';
import { getReportsUseCase } from '../../data/di';
import { ReportsException } from '../../domain/exceptions/ReportsException';
import type { ReportPresentation } from '../../domain/entities/ReportPresentation';

interface UseReportsState {
  reports: ReportPresentation[];
  loading: boolean;
  error: string | null;
}

export function useReports(): UseReportsState {
  const [reports, setReports] = useState<ReportPresentation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function fetchReports() {
      setLoading(true);
      setError(null);
      try {
        const data = await getReportsUseCase.execute();
        if (!cancelled) setReports(data);
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof ReportsException
              ? e.message
              : 'Error inesperado al cargar los reportes.',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchReports();

    return () => { cancelled = true; };
  }, []);

  return { reports, loading, error };
}
