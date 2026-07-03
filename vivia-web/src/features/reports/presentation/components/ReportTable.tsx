import { Table, type TableColumn } from '@/shared/components/Table';
import { Badge } from '@/shared/components/Badge';
import type { ReportPresentation } from '../../domain/entities/ReportPresentation';
import type { ReportPriority }     from '../../domain/objectvalues/ReportPriority';
import { verdictBadge } from './verdictBadge';

export type { ReportPresentation };

interface ReportTableProps {
  reports: ReportPresentation[];
  onAttend?: (reportId: string) => void;
  onViewDetail?: (reportId: string) => void;
}


const PRIORITY_COLOR: Record<ReportPriority, 'red' | 'orange' | 'blue'> = {
  HIGH:   'red',
  MEDIUM: 'orange',
  LOW:    'blue',
};

const AVATAR_COLORS = [
  'bg-[#176b87]', 'bg-[#ef4949]', 'bg-[#ffa330]', 'bg-[#26af72]',
  'bg-[#1e64e6]', 'bg-[#8b5cf6]', 'bg-[#ec4899]',
];

function getAvatarColor(name: string): string {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

function getInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase();
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleString('es-MX', {
    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
  });
}

export function ReportTable({ reports, onAttend, onViewDetail }: ReportTableProps) {
  const columns: TableColumn<ReportPresentation>[] = [
    {
      key: 'createdAt',
      header: 'FECHA',
      width: '130px',
      render: (row) => (
        <div>
          <p className="font-poppins font-semibold text-[12px] text-vivia-dark">
            {formatDate(row.createdAt)}
          </p>
        </div>
      ),
    },
    {
      key: 'propertyTitle',
      header: 'PROPIEDAD',
      width: '220px',
      render: (row) => (
        <p className="font-poppins font-semibold text-[12px] text-vivia-dark leading-snug line-clamp-2">
          {row.propertyTitle}
        </p>
      ),
    },
    {
      key: 'lessorName',
      header: 'ARRENDADOR',
      width: '170px',
      render: (row) => (
        <div className="flex items-center gap-2">
          <div className={`size-[30px] rounded-full flex items-center justify-center shrink-0 ${getAvatarColor(row.lessorName)}`}>
            <span className="font-poppins font-semibold text-[12px] text-white">
              {getInitial(row.lessorName)}
            </span>
          </div>
          <p className="font-poppins font-medium text-[12px] text-vivia-dark leading-snug line-clamp-2">
            {row.lessorName}
          </p>
        </div>
      ),
    },
    {
      key: 'reason',
      header: 'MOTIVO',
      width: '160px',
      render: (row) => (
        <div className="py-1 px-1">
          <Badge label={row.reason.name} color={PRIORITY_COLOR[row.reason.priority]} shape="tag" />
        </div>
      ),
    },
    {
      key: 'comment',
      header: 'COMENTARIO',
      width: '220px',
      render: (row) => (
        <p
          className="font-poppins text-[11px] text-[#6f7e88] leading-snug line-clamp-3"
          title={row.comment}
        >
          {row.comment}
        </p>
      ),
    },
    {
      key: 'verdict',
      header: 'VEREDICTO',
      width: '130px',
      render: (row) => {
        const badge = verdictBadge(row.resolved, row.verdict);
        return <Badge label={badge.label} color={badge.color} />;
      },
    },
    {
      key: 'action',
      header: 'ACCIÓN',
      render: (row) =>
        row.resolved ? (
          <button
            onClick={() => onViewDetail?.(row.id)}
            className="h-8 w-[110px] rounded-[8px] bg-[#f0f6f7] font-poppins font-medium text-[11px] text-[#6f7e88] hover:bg-[#e6eaed] transition-colors cursor-pointer"
          >
            Ver detalle
          </button>
        ) : (
          <button
            onClick={() => onAttend?.(row.id)}
            className="h-8 w-[110px] rounded-[8px] bg-vivia-dark font-poppins font-medium text-[11px] text-white hover:bg-vivia-mid transition-colors cursor-pointer"
          >
            Atender
          </button>
        ),
    },
  ];

  return <Table columns={columns} data={reports} keyExtractor={(row) => row.id} />;
}
