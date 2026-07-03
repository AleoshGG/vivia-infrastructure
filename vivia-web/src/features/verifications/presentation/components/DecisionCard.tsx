import type { VerificationDecision } from '../../domain/objectvalues/VerificationDecision';

export const REVIEW_CHECKLIST = [
  'Foto coincide con documento de identidad',
  'Datos del documento son legibles',
  'Documento no muestra signos de alteración',
];

interface DecisionCardProps {
  decision: VerificationDecision | null;
  comment: string;
  checkedReasons: Set<string>;
  submitting: boolean;
  error: string | null;
  onDecisionChange: (decision: VerificationDecision) => void;
  onCommentChange: (comment: string) => void;
  onToggleReason: (label: string) => void;
  onCancel: () => void;
  onSave: () => void;
}

export function DecisionCard({
  decision,
  comment,
  checkedReasons,
  submitting,
  error,
  onDecisionChange,
  onCommentChange,
  onToggleReason,
  onCancel,
  onSave,
}: DecisionCardProps) {
  const commentRequired = decision === 'REJECTED';
  const canSave = !!decision && !submitting && (!commentRequired || comment.trim().length > 0);

  return (
    <div className="bg-white rounded-xl shadow-[0px_2px_8px_0px_rgba(0,0,0,0.06)] p-6">
      <h2 className="font-poppins font-semibold text-[14px] text-vivia-dark">Decisión de Validación</h2>
      <div className="h-px bg-[#e6eaed] my-4" />

      <p className="font-poppins font-medium text-[12px] text-vivia-dark">Resultado de la verificación</p>

      <div className="flex gap-4 mt-3">
        <button
          onClick={() => onDecisionChange('VERIFIED')}
          className={`flex-1 h-[52px] rounded-[10px] flex items-center gap-3 px-4 cursor-pointer transition-colors ${
            decision === 'VERIFIED'
              ? 'border-2 border-[#26af72] bg-[rgba(38,175,114,0.12)]'
              : 'border-[1.5px] border-[#e6eaed] bg-[#f0f6f7]'
          }`}
        >
          <span className={`text-[18px] ${decision === 'VERIFIED' ? 'text-[#26af72]' : 'text-[#6f7e88]'}`}>✓</span>
          <div className="text-left">
            <p className={`font-poppins font-semibold text-[14px] leading-none ${decision === 'VERIFIED' ? 'text-[#26af72]' : 'text-[#6f7e88]'}`}>
              Aprobar
            </p>
            <p className={`font-poppins text-[10px] mt-1 ${decision === 'VERIFIED' ? 'text-[rgba(38,175,114,0.75)]' : 'text-[rgba(111,126,136,0.75)]'}`}>
              Identidad verificada
            </p>
          </div>
        </button>

        <button
          onClick={() => onDecisionChange('REJECTED')}
          className={`flex-1 h-[52px] rounded-[10px] flex items-center gap-3 px-4 cursor-pointer transition-colors ${
            decision === 'REJECTED'
              ? 'border-2 border-[#ef4949] bg-[rgba(239,73,73,0.12)]'
              : 'border-[1.5px] border-[#e6eaed] bg-[#f0f6f7]'
          }`}
        >
          <span className={`text-[18px] ${decision === 'REJECTED' ? 'text-[#ef4949]' : 'text-[#6f7e88]'}`}>✕</span>
          <div className="text-left">
            <p className={`font-poppins font-semibold text-[14px] leading-none ${decision === 'REJECTED' ? 'text-[#ef4949]' : 'text-[#6f7e88]'}`}>
              Rechazar
            </p>
            <p className={`font-poppins text-[10px] mt-1 ${decision === 'REJECTED' ? 'text-[rgba(239,73,73,0.75)]' : 'text-[rgba(111,126,136,0.75)]'}`}>
              Documentos inválidos
            </p>
          </div>
        </button>
      </div>

      <p className="font-poppins font-medium text-[12px] text-vivia-dark mt-5">Comentarios del revisor</p>
      <p className="font-poppins text-[11px] text-[#6f7e88] mt-1">Opcional para aprobación · Requerido si se rechaza</p>
      <textarea
        value={comment}
        onChange={(e) => onCommentChange(e.target.value)}
        placeholder="Ej. «Los documentos presentados coinciden con la información registrada. Foto de calidad adecuada...»"
        className="mt-3 w-full h-[100px] rounded-lg bg-[#f9fbfc] border-[1.5px] border-[#e6eaed] p-3 font-poppins text-[12px] text-vivia-dark placeholder:text-[rgba(111,126,136,0.5)] resize-none outline-none focus:border-vivia-mid"
      />

      <div className="flex flex-col gap-3 mt-4">
        {REVIEW_CHECKLIST.map((label) => {
          const checked = checkedReasons.has(label);
          return (
            <button
              key={label}
              onClick={() => onToggleReason(label)}
              className="flex items-center gap-3 cursor-pointer text-left"
            >
              <span
                className={`size-[18px] rounded flex items-center justify-center text-white text-[11px] font-bold border-[1.5px] ${
                  checked ? 'bg-[#26af72] border-[#26af72]' : 'bg-white border-[#e6eaed]'
                }`}
              >
                {checked && '✓'}
              </span>
              <span className={`font-poppins text-[12px] ${checked ? 'text-vivia-dark' : 'text-[#6f7e88]'}`}>
                {label}
              </span>
            </button>
          );
        })}
      </div>

      {error && (
        <p className="mt-4 px-3 py-2 rounded-lg bg-[rgba(239,73,73,0.08)] border border-[rgba(239,73,73,0.2)] font-poppins text-[11px] text-[#ef4949]">
          {error}
        </p>
      )}

      <div className="h-px bg-[#e6eaed] my-5" />

      <div className="flex gap-4">
        <button
          onClick={onCancel}
          disabled={submitting}
          className="w-[152px] h-11 rounded-[10px] border-[1.5px] border-[#e6eaed] bg-white font-poppins font-medium text-[13px] text-[#6f7e88] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Cancelar
        </button>
        <button
          onClick={onSave}
          disabled={!canSave}
          className="flex-1 h-11 rounded-[10px] bg-[#26af72] font-poppins font-semibold text-[14px] text-white flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>✓</span> {submitting ? 'Guardando…' : 'Guardar Decisión'}
        </button>
      </div>
    </div>
  );
}
