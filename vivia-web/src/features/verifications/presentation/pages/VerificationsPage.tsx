import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sidebar } from '@/shared/components/Sidebar';
import { TopBar } from '@/shared/components/TopBar';
import { Pagination } from '@/shared/components/Pagination';
import { VerificationTabs, type ReviewTab } from '../components/VerificationTabs';
import { VerificationTable } from '../components/VerificationTable';
import { useLessorsByStatus } from '../hooks/useLessorsByStatus';

const PAGE_SIZE = 8;

interface VerificationsPageProps {
  onLogout?: () => void;
}

export function VerificationsPage({ onLogout }: VerificationsPageProps) {
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState<ReviewTab>('PENDING_REVIEW');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [counts, setCounts] = useState<Partial<Record<ReviewTab, number>>>({});

  const { lessors, loading, error } = useLessorsByStatus(activeTab);

  useEffect(() => {
    if (!loading && !error) {
      setCounts((prev) => ({ ...prev, [activeTab]: lessors.length }));
    }
  }, [activeTab, loading, error, lessors.length]);

  const filtered = lessors.filter((l) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return l.name.toLowerCase().includes(q) || l.email.toLowerCase().includes(q);
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const handleTabChange = (tab: ReviewTab) => {
    setActiveTab(tab);
    setCurrentPage(1);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1);
  };

  return (
    <div className="flex min-h-screen bg-[#f0f6f7] font-poppins">
      <Sidebar activeItem="identity" onLogout={onLogout} />

      <div className="flex-1 ml-[240px] flex flex-col">
        <TopBar
          title="Verificación de Identidad"
          breadcrumb="Panel de Control  ›  Verificación de Identidad"
        />

        <VerificationTabs
          activeTab={activeTab}
          counts={counts}
          searchQuery={searchQuery}
          onTabChange={handleTabChange}
          onSearchChange={handleSearchChange}
        />

        <div className="px-6 py-4 flex-1">
          {loading && (
            <p className="font-poppins text-[13px] text-[#6f7e88] text-center py-10">
              Cargando verificaciones…
            </p>
          )}

          {error && (
            <p className="font-poppins text-[13px] text-[#ef4949] text-center py-10">
              {error}
            </p>
          )}

          {!loading && !error && (
            <>
              <VerificationTable
                lessors={paginated}
                onReview={(lessorId) => navigate(`/identity/${lessorId}`)}
              />
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages || 1}
                totalItems={filtered.length}
                pageSize={PAGE_SIZE}
                onPageChange={setCurrentPage}
                itemLabel="solicitudes"
              />
            </>
          )}
        </div>
      </div>
    </div>
  );
}
