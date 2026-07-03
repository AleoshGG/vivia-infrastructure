import type { IReportsRepository } from '../repositories/IReportsRepository';
import type { ReportDetail } from '../entities/ReportDetail';
import { ReportsException } from '../exceptions/ReportsException';

export class GetReportDetailUseCase {
  private readonly repo: IReportsRepository;

  constructor(repo: IReportsRepository) {
    this.repo = repo;
  }

  async execute(id: string): Promise<ReportDetail> {
    try {
      return await this.repo.getReportDetail(id);
    } catch (error) {
      if (error instanceof ReportsException) throw error;
      console.error('[GetReportDetailUseCase] causa original:', error);
      throw new ReportsException('No se pudo cargar el detalle del reporte. Intenta de nuevo.');
    }
  }
}
