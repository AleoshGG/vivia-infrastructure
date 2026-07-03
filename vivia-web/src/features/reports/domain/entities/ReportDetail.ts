import type { ReportReason }     from '../objectvalues/ReportReason';
import type { ReportVerdict }    from '../objectvalues/ReportVerdict';
import type { ReportedProperty } from './ReportedProperty';
import type { ReportLessor }     from './ReportLessor';
import type { ReportLessee }     from './ReportLessee';

export interface ReportDetail {
  id: string;
  /** null cuando la publicación reportada ya no existe */
  property: ReportedProperty | null;
  propertyTitle: string;
  lessor: ReportLessor;
  lessee: ReportLessee;
  reason: ReportReason;
  comment: string;
  /** null mientras el reporte no ha sido resuelto */
  verdict: ReportVerdict | null;
  createdAt: string;
  resolvedAt: string | null;
  resolved: boolean;
}
