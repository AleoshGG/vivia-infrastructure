import type { LessorVerificationDto } from '../dtos/LessorVerificationDto';
import type { LessorVerification } from '../../domain/entities/LessorVerification';

export function lessorVerificationDtoToEntity(dto: LessorVerificationDto): LessorVerification {
  return {
    lessorId: dto.lessorId,
    name: dto.name,
    email: dto.email,
    verificationStatus: dto.verificationStatus,
    lastUploadedAt: dto.lastUploadedAt ?? null,
  };
}
