import type { ReportReason }  from '../objectvalues/ReportReason';
import type { ReportVerdict } from '../objectvalues/ReportVerdict';

export interface ReportPresentation {
  id: string;
  propertyTitle: string;
  lessorName: string;
  reason: ReportReason;
  comment: string;
  verdict: ReportVerdict;
  createdAt: string;
  resolved: boolean;
}
