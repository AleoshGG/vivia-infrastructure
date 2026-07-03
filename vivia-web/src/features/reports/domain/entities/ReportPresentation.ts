import type { ReportReason }  from '../objectvalues/ReportReason';
import type { ReportVerdict } from '../objectvalues/ReportVerdict';

export interface ReportPresentation {
  id: string;
  propertyTitle: string;
  lessorName: string;
  reason: ReportReason;
  comment: string;
  /** null mientras el reporte no ha sido resuelto */
  verdict: ReportVerdict | null;
  createdAt: string;
  resolved: boolean;
}
