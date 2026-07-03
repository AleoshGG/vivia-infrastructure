import { Table, type TableColumn } from '@/shared/components/Table';
import type { LessorVerification } from '../../domain/entities/LessorVerification';
import { avatarColorFor } from './avatarColor';

function formatDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatRelativeTime(iso: string | null): string {
  if (!iso) return '—';
  const diffMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.floor(diffMs / 60_000);
  if (minutes < 1) return 'Justo ahora';
  if (minutes < 60) return `Hace ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Hace ${hours} hr`;
  const days = Math.floor(hours / 24);
  return `Hace ${days} día${days === 1 ? '' : 's'}`;
}

interface VerificationTableProps {
  lessors: LessorVerification[];
  onReview?: (lessorId: string) => void;
}

export function VerificationTable({ lessors, onReview }: VerificationTableProps) {
  const columns: TableColumn<LessorVerification>[] = [
    {
      key: 'user',
      header: 'USUARIO',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div
            className="size-[38px] rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: avatarColorFor(row.lessorId) }}
          >
            <span className="font-poppins font-semibold text-[14px] text-white">
              {row.name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div>
            <p className="font-poppins font-medium text-[13px] text-vivia-dark leading-none">{row.name}</p>
            <p className="font-poppins text-[11px] text-[#6f7e88] leading-none mt-1.5">{row.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: 'documentType',
      header: 'TIPO DE DOCUMENTO',
      render: () => <span className="font-poppins text-[12px] text-vivia-dark">INE</span>,
    },
    {
      key: 'requestDate',
      header: 'FECHA SOLICITUD',
      render: (row) => <span className="font-poppins text-[12px] text-vivia-dark">{formatDate(row.lastUploadedAt)}</span>,
    },
    {
      key: 'age',
      header: 'ANTIGÜEDAD',
      render: (row) => <span className="font-poppins text-[12px] text-[#6f7e88]">{formatRelativeTime(row.lastUploadedAt)}</span>,
    },
    {
      key: 'action',
      header: 'ACCIÓN',
      width: '120px',
      render: (row) => (
        <button
          onClick={() => onReview?.(row.lessorId)}
          className="h-8 w-[102px] rounded-lg bg-vivia-dark text-white font-poppins font-medium text-[12px] cursor-pointer"
        >
          Revisar
        </button>
      ),
    },
  ];

  return <Table columns={columns} data={lessors} keyExtractor={(row) => row.lessorId} />;
}
