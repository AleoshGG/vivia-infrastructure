import type { IReportsRepository } from '../repositories/IReportsRepository';
import type { ReportPresentation } from '../entities/ReportPresentation';
import { ReportsException } from '../exceptions/ReportsException';

export class GetReportsUseCase {
  constructor(private readonly repo: IReportsRepository) {}

  async execute(): Promise<ReportPresentation[]> {
    try {
      return await this.repo.getPendingReports();
    } catch (error) {
      if (error instanceof ReportsException) throw error;
      throw new ReportsException('No se pudieron cargar los reportes. Intenta de nuevo.');
    }
  }

  subscribeToNewReports(
    onNew: (report: ReportPresentation) => void,
    onError?: (e: Error) => void,
  ): () => void {
    return this.repo.subscribeToNewReports(onNew, onError);
  }
}
