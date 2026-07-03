import { ApiReportsRepository } from '../repositories/ApiReportsRepository';
import { GetReportsUseCase } from '../../domain/usecases/GetReportsUseCase';

const reportsRepository = new ApiReportsRepository();

export const getReportsUseCase = new GetReportsUseCase(reportsRepository);
