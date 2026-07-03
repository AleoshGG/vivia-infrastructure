import type { ReportPresentation } from '../entities/ReportPresentation';

export interface IReportsRepository {
  getPendingReports(): Promise<ReportPresentation[]>;
  subscribeToNewReports(
    onNew: (report: ReportPresentation) => void,
    onError?: (e: Error) => void,
  ): () => void;
}
