import type { IVerificationsRepository } from '../repositories/IVerificationsRepository';
import type { LessorVerification } from '../entities/LessorVerification';
import type { VerificationStatus } from '../objectvalues/VerificationStatus';
import { VerificationsException } from '../exceptions/VerificationsException';

export class GetLessorsByStatusUseCase {
  private readonly repo: IVerificationsRepository;

  constructor(repo: IVerificationsRepository) {
    this.repo = repo;
  }

  async execute(status: VerificationStatus): Promise<LessorVerification[]> {
    try {
      return await this.repo.getLessorsByStatus(status);
    } catch (error) {
      if (error instanceof VerificationsException) throw error;
      throw new VerificationsException('No se pudieron cargar las verificaciones. Intenta de nuevo.');
    }
  }
}
