import { httpClient } from '@/core/di';
import { VerificationsException } from '../../domain/exceptions/VerificationsException';
import type { IVerificationsRepository } from '../../domain/repositories/IVerificationsRepository';
import type { LessorVerification } from '../../domain/entities/LessorVerification';
import type { LessorVerificationDetail } from '../../domain/entities/LessorVerificationDetail';
import type { VerificationStatus } from '../../domain/objectvalues/VerificationStatus';
import type { VerificationDecision } from '../../domain/objectvalues/VerificationDecision';
import type { GetLessorsResponseDto } from '../dtos/LessorVerificationDto';
import type { GetLessorDetailResponseDto } from '../dtos/LessorVerificationDetailDto';
import type { ReviewVerificationRequestDto, ReviewVerificationResponseDto } from '../dtos/ReviewVerificationDto';
import { lessorVerificationDtoToEntity } from '../mappers/lessorVerificationDtoToEntity';
import { lessorVerificationDetailDtoToEntity } from '../mappers/lessorVerificationDetailDtoToEntity';

export class ApiVerificationsRepository implements IVerificationsRepository {
  async getLessorsByStatus(status: VerificationStatus): Promise<LessorVerification[]> {
    const res = await httpClient.get<GetLessorsResponseDto>(`/admin/lessors?status=${status}`);

    if (!res.success) {
      throw new VerificationsException(res.message ?? 'Error al obtener las verificaciones.');
    }

    return res.data.map(lessorVerificationDtoToEntity);
  }

  async getLessorDetail(id: string): Promise<LessorVerificationDetail> {
    const res = await httpClient.get<GetLessorDetailResponseDto>(`/admin/lessors/${id}/documents`);

    if (!res.success) {
      throw new VerificationsException(res.message ?? 'Error al obtener el detalle de la verificación.');
    }

    return lessorVerificationDetailDtoToEntity(res.data);
  }

  async reviewLessorVerification(
    id: string,
    decision: VerificationDecision,
    comment: string,
    reasons: string[],
  ): Promise<void> {
    const body: ReviewVerificationRequestDto = { verificationStatus: decision, comment, reasons };
    const res = await httpClient.patch<ReviewVerificationResponseDto>(`/admin/lessors/${id}/verifications`, body);

    if (!res.success) {
      throw new VerificationsException(res.message ?? 'Error al aplicar la decisión.');
    }
  }
}
