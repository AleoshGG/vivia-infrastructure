import type { ReportPresentation } from '../entities/ReportPresentation';
import type { ReportDetail }       from '../entities/ReportDetail';
import type { ReportVerdict }      from '../objectvalues/ReportVerdict';

export interface IReportsRepository {
  getPendingReports(): Promise<ReportPresentation[]>;
  getReportDetail(id: string): Promise<ReportDetail>;
  getLessorReportHistory(lessorId: string): Promise<ReportPresentation[]>;
  applyVerdict(id: string, verdict: ReportVerdict): Promise<void>;
}
