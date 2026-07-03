import { ApiReportsRepository } from '../repositories/ApiReportsRepository';
import { GetReportsUseCase } from '../../domain/usecases/GetReportsUseCase';
import { GetReportDetailUseCase } from '../../domain/usecases/GetReportDetailUseCase';
import { GetLessorReportHistoryUseCase } from '../../domain/usecases/GetLessorReportHistoryUseCase';
import { ResolveReportUseCase } from '../../domain/usecases/ResolveReportUseCase';

const reportsRepository = new ApiReportsRepository();

export const getReportsUseCase = new GetReportsUseCase(reportsRepository);
export const getReportDetailUseCase = new GetReportDetailUseCase(reportsRepository);
export const getLessorReportHistoryUseCase = new GetLessorReportHistoryUseCase(reportsRepository);
export const resolveReportUseCase = new ResolveReportUseCase(reportsRepository);
