import type { ReportReason } from '../../domain/objectvalues/ReportReason';
import type { ReportLessee } from '../../domain/entities/ReportLessee';

interface ReportDataSectionProps {
  reason: ReportReason;
  comment: string;
  lessee: ReportLessee;
}

function getInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase();
}

export function ReportDataSection({ reason, comment, lessee }: ReportDataSectionProps) {
  return (
    <section className="relative bg-white rounded-xl shadow-[0px_2px_8px_0px_rgba(0,0,0,0.06)] overflow-hidden">
      <div className="absolute left-0 top-0 w-2 h-8 rounded-[4px] bg-[#ef4949]" />

      <div className="px-5 py-3">
        <h2 className="font-poppins font-semibold text-[13px] text-vivia-dark">
          1&nbsp;&nbsp;Datos del Reporte
        </h2>
      </div>

      <div className="px-5">
        <div className="inline-flex items-center gap-2 h-[30px] px-3 rounded-[6px] bg-[rgba(239,73,73,0.1)] border border-[rgba(239,73,73,0.3)]">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ef4949" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" />
            <line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          <span className="font-poppins font-semibold text-[12px] text-[#ef4949]">
            {reason.name}
          </span>
        </div>

        <p className="mt-4 font-poppins font-medium text-[11px] text-[#6f7e88] uppercase">
          Descripción del usuario
        </p>
        <div className="relative mt-2 rounded-lg bg-[#f9fbfc] border border-[#e6eaed] px-4 py-3">
          <span className="absolute left-3 top-1 font-poppins font-semibold text-[32px] text-[rgba(239,73,73,0.2)] leading-none select-none">
            "
          </span>
          <p className="pl-6 font-poppins text-[12px] text-vivia-dark leading-relaxed">
            {comment}
          </p>
        </div>
      </div>

      <div className="mt-4 h-px bg-[#e6eaed]" />

      <div className="px-5 py-3 pb-5">
        <p className="font-poppins font-medium text-[11px] text-[#6f7e88] uppercase">
          Usuario que reporta
        </p>
        <div className="mt-2 flex items-center gap-3">
          <div className="size-9 rounded-full bg-[#1e64e6] flex items-center justify-center shrink-0">
            <span className="font-poppins font-semibold text-[14px] text-white">
              {getInitial(lessee.name)}
            </span>
          </div>
          <div>
            <p className="font-poppins font-semibold text-[13px] text-vivia-dark leading-tight">
              {lessee.name}
            </p>
            <p className="font-poppins text-[11px] text-[#6f7e88]">{lessee.email}</p>
          </div>
        </div>
      </div>
    </section>
  );
}
