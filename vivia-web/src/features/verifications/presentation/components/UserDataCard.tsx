import type { LessorVerificationDetail } from '../../domain/entities/LessorVerificationDetail';
import type { VerificationStatus } from '../../domain/objectvalues/VerificationStatus';
import { avatarColorFor } from './avatarColor';

const STATUS_BADGE: Record<VerificationStatus, { label: string; className: string }> = {
  UNVERIFIED: { label: 'Sin verificar', className: 'bg-[rgba(111,126,136,0.12)] text-[#6f7e88]' },
  PENDING_REVIEW: { label: 'Por revisar', className: 'bg-[rgba(255,163,48,0.12)] text-[#ffa330]' },
  VERIFIED: { label: 'Aceptado', className: 'bg-[rgba(38,175,114,0.12)] text-[#26af72]' },
  REJECTED: { label: 'Rechazado', className: 'bg-[rgba(239,73,73,0.12)] text-[#ef4949]' },
};

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

interface UserDataCardProps {
  detail: LessorVerificationDetail;
}

export function UserDataCard({ detail }: UserDataCardProps) {
  const fullName = [detail.name, detail.paternalSurname, detail.maternalSurname].filter(Boolean).join(' ');
  const badge = STATUS_BADGE[detail.verificationStatus];

  return (
    <div className="bg-white rounded-xl shadow-[0px_2px_8px_0px_rgba(0,0,0,0.06)] p-6">
      <h2 className="font-poppins font-semibold text-[14px] text-vivia-dark">Datos del Usuario</h2>
      <div className="h-px bg-[#e6eaed] my-4" />

      <div className="flex items-center gap-3">
        {detail.photoUrl ? (
          <img
            src={detail.photoUrl}
            alt={fullName}
            className="size-[52px] rounded-full object-cover shrink-0"
          />
        ) : (
          <div
            className="size-[52px] rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: avatarColorFor(detail.lessorId) }}
          >
            <span className="font-poppins font-semibold text-[22px] text-white">
              {detail.name.charAt(0).toUpperCase()}
            </span>
          </div>
        )}
        <div>
          <p className="font-poppins font-semibold text-[16px] text-vivia-dark leading-none">{fullName}</p>
          <p className="font-poppins text-[12px] text-[#6f7e88] mt-1.5">{detail.email}</p>
          <span className={`inline-flex items-center justify-center h-[22px] px-3 rounded-full text-[10px] font-medium font-poppins mt-2 ${badge.className}`}>
            {badge.label}
          </span>
        </div>
      </div>

      <div className="h-px bg-[#e6eaed] my-4" />

      <div className="grid grid-cols-2 gap-y-5">
        <div>
          <p className="font-poppins text-[10px] text-[#6f7e88]">Teléfono</p>
          <p className="font-poppins font-medium text-[12px] text-vivia-dark mt-1">{detail.phoneNumber || '—'}</p>
        </div>
        <div>
          <p className="font-poppins text-[10px] text-[#6f7e88]">Nombre completo</p>
          <p className="font-poppins font-medium text-[12px] text-vivia-dark mt-1">{fullName}</p>
        </div>
        <div>
          <p className="font-poppins text-[10px] text-[#6f7e88]">Correo Electrónico</p>
          <p className="font-poppins font-medium text-[12px] text-vivia-dark mt-1">{detail.email}</p>
        </div>
        <div>
          <p className="font-poppins text-[10px] text-[#6f7e88]">Registro en Vivia</p>
          <p className="font-poppins font-medium text-[12px] text-vivia-dark mt-1">{formatDate(detail.createdAt)}</p>
        </div>
        <div>
          <p className="font-poppins text-[10px] text-[#6f7e88]">Última actualización</p>
          <p className="font-poppins font-medium text-[12px] text-vivia-dark mt-1">{formatDate(detail.updatedAt)}</p>
        </div>
      </div>
    </div>
  );
}
