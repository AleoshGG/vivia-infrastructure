import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Sidebar } from '@/shared/components/Sidebar';
import { TopBar } from '@/shared/components/TopBar';
import { ReportDataSection } from '../components/ReportDataSection';
import { PropertySnapshotSection } from '../components/PropertySnapshotSection';
import { ResolutionPanel } from '../components/ResolutionPanel';
import { PublicationPreview } from '../components/PublicationPreview';
import { useReportDetail } from '../hooks/useReportDetail';
import { useLessorHistory } from '../hooks/useLessorHistory';
import { useResolveReport } from '../hooks/useResolveReport';
import type { ReportPriority } from '../../domain/objectvalues/ReportPriority';
import type { ReportVerdict } from '../../domain/objectvalues/ReportVerdict';

interface ReportDetailsPageProps {
  onLogout?: () => void;
}

const PRIORITY_LABEL: Record<ReportPriority, string> = {
  HIGH: 'Alta prioridad',
  MEDIUM: 'Prioridad media',
  LOW: 'Prioridad baja',
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export function ReportDetailsPage({ onLogout }: ReportDetailsPageProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [showPublication, setShowPublication] = useState(false);

  const { report, loading, error } = useReportDetail(id);
  const { history: lessorHistory } = useLessorHistory(report?.lessor.id);
  const { resolve, submitting, error: resolveError } = useResolveReport();

  const handleAction = async (verdict: ReportVerdict) => {
    if (!report) return;
    const ok = await resolve(report.id, verdict);
    if (ok) navigate(-1);
  };

  return (
    <div className="flex min-h-screen bg-[#f0f6f7] font-poppins">
      <Sidebar activeItem="reports" onLogout={onLogout} />

      <div className="flex-1 ml-[240px] flex flex-col">
        <TopBar
          title={report ? `Reporte #${report.id.slice(0, 8)}` : 'Reporte'}
          breadcrumb={
            report
              ? `Reportes  ›  ${formatDateTime(report.createdAt)}  ·  ${report.reason.name}  ·  ${PRIORITY_LABEL[report.reason.priority]}`
              : 'Reportes  ›  Detalle'
          }
        />

        <div className="px-6 py-4 flex-1">
          <button
            onClick={() => navigate('/reports')}
            className="mb-3 font-poppins text-[12px] text-[#6f7e88] hover:text-vivia-dark cursor-pointer"
          >
            ← Volver a la bandeja
          </button>

          {loading && (
            <p className="font-poppins text-[13px] text-[#6f7e88] text-center py-10">
              Cargando detalle del reporte…
            </p>
          )}

          {error && (
            <p className="font-poppins text-[13px] text-[#ef4949] text-center py-10">
              {error}
            </p>
          )}

          {!loading && !error && report && (
            <div className="flex gap-4 items-start">
              <div className="flex-[3] flex flex-col gap-4 min-w-0">
                <ReportDataSection
                  reason={report.reason}
                  comment={report.comment}
                  lessee={report.lessee}
                />
                <PropertySnapshotSection
                  property={report.property}
                  propertyTitle={report.propertyTitle}
                  lessor={report.lessor}
                  lessorHistory={lessorHistory}
                  onOpenPublication={() => setShowPublication(true)}
                />
              </div>

              <div className="flex-[2] min-w-0">
                <ResolutionPanel
                  onConfirmAction={handleAction}
                  submitting={submitting}
                  error={resolveError}
                />
              </div>
            </div>
          )}
        </div>
      </div>

      {showPublication && report?.property && (
        <PublicationPreview
          property={report.property}
          onClose={() => setShowPublication(false)}
        />
      )}
    </div>
  );
}
