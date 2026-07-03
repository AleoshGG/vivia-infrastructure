import { useState, useEffect, useRef } from 'react';
import { getReportsUseCase } from '../../data/di';
import type { ReportPresentation } from '../../domain/entities/ReportPresentation';

export type SseStatus = 'connecting' | 'open' | 'error';

export function useReportStream(onNew: (report: ReportPresentation) => void) {
  const [status, setStatus] = useState<SseStatus>('connecting');

  // Ref para siempre usar el callback más reciente sin re-abrir la conexión
  const onNewRef = useRef(onNew);
  useEffect(() => { onNewRef.current = onNew; });

  useEffect(() => {
    setStatus('connecting');

    const unsubscribe = getReportsUseCase.subscribeToNewReports(
      (report) => {
        setStatus('open');
        onNewRef.current(report);
      },
      () => setStatus('error'),
    );

    // cleanup: se ejecuta al desmontar ReportsPage (cambio de página)
    return unsubscribe;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { status };
}
