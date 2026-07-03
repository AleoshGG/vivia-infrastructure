import type { IVerificationsRepository } from '../repositories/IVerificationsRepository';
import type { LessorVerificationDetail } from '../entities/LessorVerificationDetail';
import { VerificationsException } from '../exceptions/VerificationsException';

export class GetLessorDetailUseCase {
  private readonly repo: IVerificationsRepository;

  constructor(repo: IVerificationsRepository) {
    this.repo = repo;
  }

  async execute(id: string): Promise<LessorVerificationDetail> {
    try {
      return await this.repo.getLessorDetail(id);
    } catch (error) {
      if (error instanceof VerificationsException) throw error;
      throw new VerificationsException('No se pudo cargar el detalle de la verificación. Intenta de nuevo.');
    }
  }
}
