import type { VerificationStatus } from '../../domain/objectvalues/VerificationStatus';

export interface LessorVerificationDto {
  lessorId: string;
  name: string;
  email: string;
  verificationStatus: VerificationStatus;
  lastUploadedAt: string | null;
}

export interface GetLessorsResponseDto {
  success: boolean;
  data: LessorVerificationDto[];
  message: string;
  status: string;
}
