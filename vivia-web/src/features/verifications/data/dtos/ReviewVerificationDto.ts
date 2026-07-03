import type { VerificationDecision } from '../../domain/objectvalues/VerificationDecision';

export interface ReviewVerificationRequestDto {
  verificationStatus: VerificationDecision;
  comment: string;
  reasons: string[];
}

export interface ReviewVerificationResponseDto {
  success: boolean;
  data: Record<string, never>;
  message: string;
  status: string;
}
