import { useState } from 'react';
import type { ReportVerdict } from '../../domain/objectvalues/ReportVerdict';

interface ResolutionPanelProps {
  onConfirmAction?: (verdict: ReportVerdict) => void;
  submitting?: boolean;
  error?: string | null;
}

interface ActionConfig {
  action: ReportVerdict;
  title: string;
  subtitle: string;
  confirmText: string;
  container: string;
  titleColor: string;
  subtitleColor: string;
}

const ACTIONS: ActionConfig[] = [
  {
    action: 'DISMISSED',
    title: 'Descartar reporte',
    subtitle: 'Falsa alarma — cerrar sin acción',
    confirmText: 'El reporte se marcará como resuelto sin ninguna acción adicional.',
    container: 'bg-[#f0f6f7] border-[#e6eaed]',
    titleColor: 'text-vivia-dark',
    subtitleColor: 'text-[#6f7e88]',
  },
  {
    action: 'PROPERTY_DELETED',
    title: 'Eliminar publicación',
    subtitle: 'Borrado de la propiedad y notificación al arrendador',
    confirmText:
      'La publicación reportada será eliminada y se notificará al arrendador que incumplió las reglas.',
    container: 'bg-[#fff0f0] border-[#efafaf]',
    titleColor: 'text-[#ef4949]',
    subtitleColor: 'text-[#6f7e88]',
  },
  {
    action: 'ACCOUNT_SUSPENDED',
    title: 'Suspender Arrendador',
    subtitle: 'Bloqueo de cuenta por fraude comprobado',
    confirmText:
      'La cuenta del arrendador será suspendida y se le notificará que contacte a soporte.',
    container: 'bg-[#b82626] border-[#b82626]',
    titleColor: 'text-white',
    subtitleColor: 'text-[rgba(255,255,255,0.75)]',
  },
];

export function ResolutionPanel({ onConfirmAction, submitting = false, error = null }: ResolutionPanelProps) {
  const [pendingAction, setPendingAction] = useState<ActionConfig | null>(null);

  const handleConfirm = () => {
    if (!pendingAction || submitting) return;
    onConfirmAction?.(pendingAction.action);
  };

  return (
    <section className="relative bg-white rounded-xl shadow-[0px_2px_8px_0px_rgba(0,0,0,0.06)] overflow-hidden">
      <div className="absolute left-0 top-0 w-2 h-8 rounded-[4px] bg-vivia-dark" />

      <div className="px-5 py-3 flex items-center gap-3">
        <h2 className="font-poppins font-semibold text-[13px] text-vivia-dark">
          3&nbsp;&nbsp;Panel de Resolución
        </h2>
        <div className="flex items-center gap-1.5 text-[#6f7e88]">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
          </svg>
          <span className="font-poppins text-[10px]">Solo moderadores</span>
        </div>
      </div>

      <div className="h-px bg-[#e6eaed]" />

      <div className="px-5 py-3 pb-5">
        <p className="font-poppins font-medium text-[11px] text-[#6f7e88] uppercase">
          Acción a tomar
        </p>
        <p className="font-poppins text-[10px] text-[#6f7e88]">
          Ordenado de menor a mayor severidad
        </p>

        <div className="mt-3 flex flex-col gap-2">
          {ACTIONS.map((cfg) => (
            <button
              key={cfg.action}
              onClick={() => setPendingAction(cfg)}
              disabled={submitting}
              className={`w-full h-[60px] rounded-[10px] border px-4 flex items-center justify-between text-left transition-transform hover:scale-[1.01] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${cfg.container}`}
            >
              <div>
                <p className={`font-poppins font-semibold text-[12px] ${cfg.titleColor}`}>
                  {cfg.title}
                </p>
                <p className={`font-poppins text-[10px] ${cfg.subtitleColor}`}>
                  {cfg.subtitle}
                </p>
              </div>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" className={cfg.titleColor} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-2 h-9 px-3 rounded-lg bg-[#f0f6f7]">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#6f7e88" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" />
            <line x1="12" y1="16" x2="12" y2="12" />
            <line x1="12" y1="8" x2="12.01" y2="8" />
          </svg>
          <p className="font-poppins text-[10px] text-[#6f7e88]">
            Toda acción requiere confirmación antes de aplicarse
          </p>
        </div>
      </div>

      {pendingAction && (
        <div
          className="fixed inset-0 z-50 bg-[rgba(4,54,74,0.6)] flex items-center justify-center p-6"
          onClick={() => { if (!submitting) setPendingAction(null); }}
        >
          <div
            className="w-[400px] bg-white rounded-xl shadow-2xl p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-poppins font-semibold text-[15px] text-vivia-dark">
              ¿Confirmar "{pendingAction.title}"?
            </h3>
            <p className="mt-2 font-poppins text-[12px] text-[#6f7e88] leading-relaxed">
              {pendingAction.confirmText}
            </p>
            {error && (
              <p className="mt-3 px-3 py-2 rounded-lg bg-[rgba(239,73,73,0.08)] border border-[rgba(239,73,73,0.2)] font-poppins text-[11px] text-[#ef4949]">
                {error}
              </p>
            )}
            <div className="mt-5 flex justify-end gap-2">
              <button
                onClick={() => setPendingAction(null)}
                disabled={submitting}
                className="px-4 h-9 rounded-lg border border-[#e6eaed] font-poppins font-medium text-[12px] text-[#6f7e88] hover:bg-[#f0f6f7] cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirm}
                disabled={submitting}
                className={`px-4 h-9 rounded-lg font-poppins font-medium text-[12px] text-white cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed ${
                  pendingAction.action === 'DISMISSED' ? 'bg-vivia-dark hover:bg-[#065a76]' : 'bg-[#b82626] hover:bg-[#9e1f1f]'
                }`}
              >
                {submitting ? 'Aplicando…' : 'Confirmar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
