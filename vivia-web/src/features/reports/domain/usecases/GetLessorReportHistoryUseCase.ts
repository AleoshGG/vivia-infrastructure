import type { IReportsRepository } from '../repositories/IReportsRepository';
import type { ReportPresentation } from '../entities/ReportPresentation';
import { ReportsException } from '../exceptions/ReportsException';

export class GetLessorReportHistoryUseCase {
  private readonly repo: IReportsRepository;

  constructor(repo: IReportsRepository) {
    this.repo = repo;
  }

  async execute(lessorId: string): Promise<ReportPresentation[]> {
    try {
      return await this.repo.getLessorReportHistory(lessorId);
    } catch (error) {
      if (error instanceof ReportsException) throw error;
      console.error('[GetLessorReportHistoryUseCase] causa original:', error);
      throw new ReportsException('No se pudo cargar el historial del arrendador. Intenta de nuevo.');
    }
  }
}
