import { useState, useEffect } from 'react';
import { getLessorReportHistoryUseCase } from '../../data/di';
import { ReportsException } from '../../domain/exceptions/ReportsException';
import type { ReportPresentation } from '../../domain/entities/ReportPresentation';

interface UseLessorHistoryState {
  history: ReportPresentation[];
  loading: boolean;
  error: string | null;
}

/** No dispara la petición hasta recibir un lessorId (llega con el detalle del reporte). */
export function useLessorHistory(lessorId: string | undefined): UseLessorHistoryState {
  const [history, setHistory] = useState<ReportPresentation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!lessorId) return;

    let cancelled = false;

    async function fetchHistory() {
      setLoading(true);
      setError(null);
      try {
        const data = await getLessorReportHistoryUseCase.execute(lessorId!);
        if (!cancelled) setHistory(data);
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof ReportsException
              ? e.message
              : 'Error inesperado al cargar el historial del arrendador.',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchHistory();

    return () => { cancelled = true; };
  }, [lessorId]);

  return { history, loading, error };
}
