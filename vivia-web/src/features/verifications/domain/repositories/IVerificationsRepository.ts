import type { LessorVerification } from '../entities/LessorVerification';
import type { LessorVerificationDetail } from '../entities/LessorVerificationDetail';
import type { VerificationStatus } from '../objectvalues/VerificationStatus';
import type { VerificationDecision } from '../objectvalues/VerificationDecision';

export interface IVerificationsRepository {
  getLessorsByStatus(status: VerificationStatus): Promise<LessorVerification[]>;
  getLessorDetail(id: string): Promise<LessorVerificationDetail>;
  reviewLessorVerification(
    id: string,
    decision: VerificationDecision,
    comment: string,
    reasons: string[],
  ): Promise<void>;
}
