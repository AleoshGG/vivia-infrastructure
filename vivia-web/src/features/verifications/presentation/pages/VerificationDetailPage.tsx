import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Sidebar } from '@/shared/components/Sidebar';
import { DocumentsCard } from '../components/DocumentsCard';
import { UserDataCard } from '../components/UserDataCard';
import { DecisionCard } from '../components/DecisionCard';
import { useLessorDetail } from '../hooks/useLessorDetail';
import { useReviewVerification } from '../hooks/useReviewVerification';
import type { VerificationDecision } from '../../domain/objectvalues/VerificationDecision';

interface VerificationDetailPageProps {
  onLogout?: () => void;
}

function formatReceivedAt(iso: string): string {
  return new Date(iso).toLocaleString('es-MX', {
    day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
  });
}

export function VerificationDetailPage({ onLogout }: VerificationDetailPageProps) {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const { detail, loading, error } = useLessorDetail(id);
  const { review, submitting, error: reviewError } = useReviewVerification();

  const [decision, setDecision] = useState<VerificationDecision | null>(null);
  const [comment, setComment] = useState('');
  const [checkedReasons, setCheckedReasons] = useState<Set<string>>(new Set());

  const handleToggleReason = (label: string) => {
    setCheckedReasons((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const handleSave = async () => {
    if (!id || !decision) return;
    const reasons = decision === 'REJECTED' ? Array.from(checkedReasons) : [];
    const ok = await review(id, decision, comment, reasons);
    if (ok) navigate('/identity');
  };

  const receivedAt = detail?.documents.length
    ? detail.documents.reduce((latest, doc) => (doc.uploadedAt > latest ? doc.uploadedAt : latest), detail.documents[0].uploadedAt)
    : detail?.updatedAt;

  const fullName = detail
    ? [detail.name, detail.paternalSurname, detail.maternalSurname].filter(Boolean).join(' ')
    : '';

  return (
    <div className="flex min-h-screen bg-[#f0f6f7] font-poppins">
      <Sidebar activeItem="identity" onLogout={onLogout} />

      <div className="flex-1 ml-[240px] flex flex-col">
        <header className="h-16 bg-white shadow-[0px_2px_8px_0px_rgba(0,0,0,0.06)] flex items-center px-6 gap-3">
          <button
            onClick={() => navigate('/identity')}
            className="text-[#6f7e88] hover:text-vivia-dark transition-colors cursor-pointer"
          >
            ←
          </button>
          <div className="flex items-baseline gap-2">
            <span className="font-poppins text-[12px] text-[#6f7e88]">Verificación  ›</span>
            <span className="font-poppins font-semibold text-[16px] text-vivia-dark">{fullName || 'Detalle'}</span>
          </div>
          <div className="flex-1" />
          <div className="size-9 rounded-full bg-vivia-dark flex items-center justify-center">
            <span className="font-poppins font-semibold text-[14px] text-white">A</span>
          </div>
        </header>
        {receivedAt && (
          <p className="font-poppins text-[11px] text-[#6f7e88] px-6 pt-2">Recibido: {formatReceivedAt(receivedAt)}</p>
        )}

        {loading && (
          <p className="font-poppins text-[13px] text-[#6f7e88] text-center py-10">
            Cargando verificación…
          </p>
        )}

        {error && (
          <p className="font-poppins text-[13px] text-[#ef4949] text-center py-10">
            {error}
          </p>
        )}

        {!loading && !error && detail && (
          <div className="flex gap-6 px-6 py-4 flex-1 items-start">
            <div className="w-[640px] shrink-0">
              <DocumentsCard documents={detail.documents} />
            </div>
            <div className="flex-1 flex flex-col gap-6">
              <UserDataCard detail={detail} />
              <DecisionCard
                decision={decision}
                comment={comment}
                checkedReasons={checkedReasons}
                submitting={submitting}
                error={reviewError}
                onDecisionChange={setDecision}
                onCommentChange={setComment}
                onToggleReason={handleToggleReason}
                onCancel={() => navigate('/identity')}
                onSave={handleSave}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
