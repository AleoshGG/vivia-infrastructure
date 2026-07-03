import type { VerificationStatus } from '../../domain/objectvalues/VerificationStatus';

export interface LessorDocumentDto {
  id: string;
  documentType: string;
  uri: string;
  uploadedAt: string;
}

export interface LessorVerificationDetailDto {
  lessorId: string;
  name: string;
  paternalSurname: string;
  maternalSurname: string;
  email: string;
  photoUrl: string | null;
  phoneNumber: string;
  verificationStatus: VerificationStatus;
  createdAt: string;
  updatedAt: string;
  documents: LessorDocumentDto[];
}

export interface GetLessorDetailResponseDto {
  success: boolean;
  data: LessorVerificationDetailDto;
  message: string;
  status: string;
}
