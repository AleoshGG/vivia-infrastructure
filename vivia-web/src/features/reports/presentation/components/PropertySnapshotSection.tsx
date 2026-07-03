import { Badge } from '@/shared/components/Badge';
import type { ReportedProperty }   from '../../domain/entities/ReportedProperty';
import type { ReportLessor }       from '../../domain/entities/ReportLessor';
import type { ReportPresentation } from '../../domain/entities/ReportPresentation';
import type { ReportPriority }     from '../../domain/objectvalues/ReportPriority';
import { verdictBadge } from './verdictBadge';

interface PropertySnapshotSectionProps {
  property: ReportedProperty | null;
  propertyTitle: string;
  lessor: ReportLessor;
  lessorHistory: ReportPresentation[];
  onOpenPublication: () => void;
}

const PRIORITY_COLOR: Record<ReportPriority, 'red' | 'orange' | 'blue'> = {
  HIGH: 'red', MEDIUM: 'orange', LOW: 'blue',
};

function getInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase();
}

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

function formatPrice(amount: number): string {
  return amount.toLocaleString('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });
}

export function PropertySnapshotSection({
  property,
  propertyTitle,
  lessor,
  lessorHistory,
  onOpenPublication,
}: PropertySnapshotSectionProps) {
  const content = property?.content;
  const contentMedia = property?.contentMedia ?? [];
  const mainPhoto = contentMedia.find((m) => m.type === 'IMAGE') ?? contentMedia[0];
  const addressLine = content
    ? `${content.address.street} ${content.address.exteriorNumber}, ${content.address.neighborhood.name}, C.P. ${content.address.neighborhood.postalCode}`
    : '';

  return (
    <section className="relative bg-white rounded-xl shadow-[0px_2px_8px_0px_rgba(0,0,0,0.06)] overflow-hidden">
      <div className="absolute left-0 top-0 w-2 h-8 rounded-[4px] bg-[#ffa330]" />

      <div className="px-5 py-3">
        <h2 className="font-poppins font-semibold text-[13px] text-vivia-dark">
          2&nbsp;&nbsp;Snapshot de la Publicación
        </h2>
      </div>

      {content ? (
        <div className="px-5 flex gap-4">
          <div className="w-[220px] h-[160px] rounded-[10px] bg-[#d6dce5] overflow-hidden shrink-0 flex items-center justify-center">
            {mainPhoto ? (
              <img src={mainPhoto.url} alt={content.title} className="size-full object-cover" />
            ) : (
              <p className="font-poppins text-[10px] text-[#6f7e88]">Sin foto principal</p>
            )}
          </div>

          <div className="flex flex-col gap-1.5 min-w-0">
            <h3 className="font-poppins font-semibold text-[14px] text-vivia-dark truncate">
              {content.title}
            </h3>
            <p className="font-poppins text-[12px] text-vivia-dark">📍&nbsp;&nbsp;{addressLine}</p>
            <p className="font-poppins text-[12px] text-vivia-dark">
              💰&nbsp;&nbsp;{formatPrice(content.listedPrice)} / mes
            </p>
            <p className="font-poppins text-[12px] text-vivia-dark">
              🏠&nbsp;&nbsp;{content.bedrooms} recámaras · {content.bathrooms} baños · {content.areaM2} m²
            </p>
            <p className="font-poppins text-[12px] text-vivia-dark">
              📅&nbsp;&nbsp;Publicado: {formatDate(content.createdAt)}
            </p>
            <button
              onClick={onOpenPublication}
              className="mt-2 self-start font-poppins font-medium text-[11px] text-[#00d2be] hover:underline cursor-pointer"
            >
              Ver publicación completa →
            </button>
          </div>
        </div>
      ) : (
        <div className="mx-5 rounded-lg bg-[#f9fbfc] border border-[#e6eaed] px-4 py-4">
          <p className="font-poppins font-semibold text-[13px] text-vivia-dark">
            {propertyTitle}
          </p>
          <p className="mt-1 font-poppins text-[11px] text-[#6f7e88]">
            La publicación ya no existe — fue eliminada de la plataforma.
          </p>
        </div>
      )}

      <div className="mt-4 h-px bg-[#e6eaed]" />

      <div className="px-5 py-3">
        <p className="font-poppins font-medium text-[11px] text-[#6f7e88] uppercase">
          Datos del arrendador
        </p>
        <div className="mt-2 flex items-center gap-3">
          <div className="size-11 rounded-full bg-[#8b5cf6] flex items-center justify-center shrink-0">
            <span className="font-poppins font-semibold text-[16px] text-white">
              {getInitial(lessor.name)}
            </span>
          </div>
          <div>
            <p className="font-poppins font-semibold text-[14px] text-vivia-dark leading-tight">
              {lessor.name}
            </p>
            <p className="font-poppins text-[11px] text-[#6f7e88]">
              {lessor.email}&nbsp;&nbsp;·&nbsp;&nbsp;{lessor.accountStatus}
            </p>
          </div>
        </div>
      </div>

      <div className="mx-5 h-px bg-[#e6eaed]" />

      <div className="px-5 py-3 pb-5">
        <p className="font-poppins font-medium text-[11px] text-[#6f7e88] uppercase">
          Historial de reportes del arrendador
        </p>

        {lessorHistory.length > 0 && (
          <div className="mt-2 flex items-center gap-2 h-9 px-3 rounded-lg bg-[rgba(239,73,73,0.08)] border border-[rgba(239,73,73,0.25)]">
            <p className="font-poppins font-medium text-[11px] text-[#ef4949]">
              ⚠&nbsp;&nbsp;Este arrendador acumula {lessorHistory.length}{' '}
              {lessorHistory.length === 1 ? 'reporte' : 'reportes'}
            </p>
          </div>
        )}

        {lessorHistory.length === 0 ? (
          <p className="mt-3 font-poppins text-[11px] text-[#6f7e88]">
            Sin reportes previos.
          </p>
        ) : (
          <ul className="mt-3 flex flex-col gap-2">
            {lessorHistory.map((item) => {
              const badge = verdictBadge(item.resolved, item.verdict);
              return (
              <li
                key={item.id}
                className="rounded-lg border border-[#e6eaed] bg-[#f9fbfc] px-3 py-2"
              >
                <div className="flex items-center justify-between gap-2">
                  <p className="font-poppins font-semibold text-[12px] text-vivia-dark truncate">
                    {item.propertyTitle}
                  </p>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <Badge label={item.reason.name} color={PRIORITY_COLOR[item.reason.priority]} shape="tag" />
                    <Badge label={badge.label} color={badge.color} />
                  </div>
                </div>
                <p className="mt-1 font-poppins text-[11px] text-[#6f7e88] line-clamp-2">
                  {item.comment}
                </p>
                <p className="mt-1 font-poppins text-[10px] text-[#6f7e88]">
                  {formatDate(item.createdAt)}
                </p>
              </li>
              );
            })}
          </ul>
        )}
      </div>
    </section>
  );
}
