import type { LessorVerificationDetailDto, LessorDocumentDto } from '../dtos/LessorVerificationDetailDto';
import type { LessorVerificationDetail } from '../../domain/entities/LessorVerificationDetail';
import type { LessorDocument } from '../../domain/entities/LessorDocument';

function lessorDocumentDtoToEntity(dto: LessorDocumentDto): LessorDocument {
  return {
    id: dto.id,
    documentType: dto.documentType,
    uri: dto.uri,
    uploadedAt: dto.uploadedAt,
  };
}

export function lessorVerificationDetailDtoToEntity(dto: LessorVerificationDetailDto): LessorVerificationDetail {
  return {
    lessorId: dto.lessorId,
    name: dto.name,
    paternalSurname: dto.paternalSurname,
    maternalSurname: dto.maternalSurname,
    email: dto.email,
    photoUrl: dto.photoUrl ?? null,
    phoneNumber: dto.phoneNumber,
    verificationStatus: dto.verificationStatus,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    documents: (dto.documents ?? []).map(lessorDocumentDtoToEntity),
  };
}
