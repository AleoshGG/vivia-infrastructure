import type { VerificationStatus } from '../objectvalues/VerificationStatus';

export interface LessorVerification {
  lessorId: string;
  name: string;
  email: string;
  verificationStatus: VerificationStatus;
  lastUploadedAt: string | null;
}
