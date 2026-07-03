import type { ReportVerdict } from '../../domain/objectvalues/ReportVerdict';

type BadgeColor = 'red' | 'orange' | 'green' | 'gray';

interface VerdictBadge {
  label: string;
  color: BadgeColor;
}

const VERDICT_BADGE: Record<ReportVerdict, VerdictBadge> = {
  DISMISSED:         { label: 'Desestimado',           color: 'gray' },
  PROPERTY_DELETED:  { label: 'Publicación eliminada', color: 'red' },
  ACCOUNT_SUSPENDED: { label: 'Cuenta suspendida',     color: 'red' },
};

/** El estado mostrado se deriva de `resolved` + `verdict`: pendiente si no está resuelto. */
export function verdictBadge(resolved: boolean, verdict: ReportVerdict | null): VerdictBadge {
  if (!resolved) return { label: 'Pendiente', color: 'orange' };
  return verdict ? VERDICT_BADGE[verdict] : { label: 'Resuelto', color: 'gray' };
}
