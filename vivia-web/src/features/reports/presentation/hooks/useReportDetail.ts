import { useState, useEffect } from 'react';
import { getReportDetailUseCase } from '../../data/di';
import { ReportsException } from '../../domain/exceptions/ReportsException';
import type { ReportDetail } from '../../domain/entities/ReportDetail';

interface UseReportDetailState {
  report: ReportDetail | null;
  loading: boolean;
  error: string | null;
}

export function useReportDetail(id: string | undefined): UseReportDetailState {
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) {
      setLoading(false);
      setError('Reporte no especificado.');
      return;
    }

    let cancelled = false;

    async function fetchDetail() {
      setLoading(true);
      setError(null);
      try {
        const data = await getReportDetailUseCase.execute(id!);
        if (!cancelled) setReport(data);
      } catch (e) {
        if (!cancelled) {
          setError(
            e instanceof ReportsException
              ? e.message
              : 'Error inesperado al cargar el detalle del reporte.',
          );
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchDetail();

    return () => { cancelled = true; };
  }, [id]);

  return { report, loading, error };
}
