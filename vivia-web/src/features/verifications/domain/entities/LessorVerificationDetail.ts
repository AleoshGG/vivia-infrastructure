import type { VerificationStatus } from '../objectvalues/VerificationStatus';
import type { LessorDocument } from './LessorDocument';

export interface LessorVerificationDetail {
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
  documents: LessorDocument[];
}
