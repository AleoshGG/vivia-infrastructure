import { ApiVerificationsRepository } from '../repositories/ApiVerificationsRepository';
import { GetLessorsByStatusUseCase } from '../../domain/usecases/GetLessorsByStatusUseCase';
import { GetLessorDetailUseCase } from '../../domain/usecases/GetLessorDetailUseCase';
import { ReviewLessorVerificationUseCase } from '../../domain/usecases/ReviewLessorVerificationUseCase';

const verificationsRepository = new ApiVerificationsRepository();

export const getLessorsByStatusUseCase = new GetLessorsByStatusUseCase(verificationsRepository);
export const getLessorDetailUseCase = new GetLessorDetailUseCase(verificationsRepository);
export const reviewLessorVerificationUseCase = new ReviewLessorVerificationUseCase(verificationsRepository);
