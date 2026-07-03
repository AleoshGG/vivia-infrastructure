import type { IVerificationsRepository } from '../repositories/IVerificationsRepository';
import type { VerificationDecision } from '../objectvalues/VerificationDecision';
import { VerificationsException } from '../exceptions/VerificationsException';

export class ReviewLessorVerificationUseCase {
  private readonly repo: IVerificationsRepository;

  constructor(repo: IVerificationsRepository) {
    this.repo = repo;
  }

  async execute(
    id: string,
    decision: VerificationDecision,
    comment: string,
    reasons: string[],
  ): Promise<void> {
    try {
      await this.repo.reviewLessorVerification(id, decision, comment, reasons);
    } catch (error) {
      if (error instanceof VerificationsException) throw error;
      throw new VerificationsException('No se pudo aplicar la decisión. Intenta de nuevo.');
    }
  }
}
