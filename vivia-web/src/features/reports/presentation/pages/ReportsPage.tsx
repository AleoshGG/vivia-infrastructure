import { useState, useCallback } from 'react';
import { Sidebar } from '@/shared/components/Sidebar';
import { TopBar } from '@/shared/components/TopBar';
import { Pagination } from '@/shared/components/Pagination';
import { FilterBar, type PriorityFilter } from '../components/FilterBar';
import { ReportTable } from '../components/ReportTable';
import { useReports } from '../hooks/useReports';
import { useReportStream } from '../hooks/useReportStream';
import type { ReportPresentation } from '../../domain/entities/ReportPresentation';

const PAGE_SIZE = 7;

interface ReportsPageProps {
  onLogout?: () => void;
}

export function ReportsPage({ onLogout }: ReportsPageProps) {
  const { reports, loading, error } = useReports();

  const [liveReports, setLiveReports] = useState<ReportPresentation[]>([]);
  const { status: streamStatus } = useReportStream(
    useCallback((newReport: ReportPresentation) => {
      setLiveReports((prev) => [newReport, ...prev]);
    }, []),
  );

  const [activePriority, setActivePriority] = useState<PriorityFilter>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);

  // Los reportes en vivo se anteponen a los cargados inicialmente
  const allReports = [...liveReports, ...reports];

  const filtered = allReports.filter((r) => {
    if (activePriority && r.reason.priority !== activePriority) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (
        !r.propertyTitle.toLowerCase().includes(q) &&
        !r.lessorName.toLowerCase().includes(q)
      ) return false;
    }
    return true;
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  return (
    <div className="flex min-h-screen bg-[#f0f6f7] font-poppins">
      <Sidebar activeItem="reports" onLogout={onLogout} />

      <div className="flex-1 ml-[240px] flex flex-col">
        <TopBar
          title="Bandeja de Reportes"
          breadcrumb="Panel de Control  ›  Reportes"
        />

        <FilterBar
          activePriority={activePriority}
          searchQuery={searchQuery}
          onPriorityChange={(p) => { setActivePriority(p); setCurrentPage(1); }}
          onSearchChange={(q) => { setSearchQuery(q); setCurrentPage(1); }}
        />

        {streamStatus === 'error' && (
          <div className="mx-6 mt-3 px-4 py-2 rounded-lg bg-[rgba(239,73,73,0.08)] border border-[rgba(239,73,73,0.2)]">
            <p className="font-poppins text-[11px] text-[#ef4949]">
              ⚠ Sin conexión en tiempo real. Los nuevos reportes no se actualizarán automáticamente.
            </p>
          </div>
        )}

        <div className="px-6 py-4 flex-1">
          {loading && (
            <p className="font-poppins text-[13px] text-[#6f7e88] text-center py-10">
              Cargando reportes…
            </p>
          )}

          {error && (
            <p className="font-poppins text-[13px] text-[#ef4949] text-center py-10">
              {error}
            </p>
          )}

          {!loading && !error && (
            <>
              <ReportTable
                reports={paginated}
                onAttend={(id) => console.log('Atender', id)}
                onViewDetail={(id) => console.log('Ver detalle', id)}
              />
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages || 1}
                totalItems={filtered.length}
                pageSize={PAGE_SIZE}
                onPageChange={setCurrentPage}
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
