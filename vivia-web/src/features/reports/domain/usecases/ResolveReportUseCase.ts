import type { IReportsRepository } from '../repositories/IReportsRepository';
import type { ReportVerdict } from '../objectvalues/ReportVerdict';
import { ReportsException } from '../exceptions/ReportsException';

export class ResolveReportUseCase {
  private readonly repo: IReportsRepository;

  constructor(repo: IReportsRepository) {
    this.repo = repo;
  }

  async execute(id: string, verdict: ReportVerdict): Promise<void> {
    try {
      await this.repo.applyVerdict(id, verdict);
    } catch (error) {
      if (error instanceof ReportsException) throw error;
      throw new ReportsException('No se pudo aplicar el veredicto. Intenta de nuevo.');
    }
  }
}
