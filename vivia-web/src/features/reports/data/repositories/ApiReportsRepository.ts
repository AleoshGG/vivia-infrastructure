import { httpClient, sseClient } from '@/core/di';
import { ReportsException } from '../../domain/exceptions/ReportsException';
import type { IReportsRepository } from '../../domain/repositories/IReportsRepository';
import type { ReportPresentation } from '../../domain/entities/ReportPresentation';
import type { GetReportsResponseDto, ReportPresentationDto } from '../dtos/ReportPresentationDto';
import { reportDtoToPresentation } from '../mappers/reportDtoToPresentation';

export class ApiReportsRepository implements IReportsRepository {
  async getPendingReports(): Promise<ReportPresentation[]> {
    const res = await httpClient.get<GetReportsResponseDto>('/admin/reports');

    if (!res.success) {
      throw new ReportsException(res.message ?? 'Error al obtener los reportes.');
    }

    return res.data.map(reportDtoToPresentation);
  }

  subscribeToNewReports(
    onNew: (report: ReportPresentation) => void,
    onError?: (e: Error) => void,
  ): () => void {
    const sub = sseClient.subscribe(
      '/admin/reports/stream',
      'report_new',
      (raw) => {
        try {
          const dto: ReportPresentationDto = JSON.parse(raw);
          onNew(reportDtoToPresentation(dto));
        } catch {
          // mensaje malformado — se ignora silenciosamente
        }
      },
      undefined,
      onError,
    );

    return () => sub.close();
  }
}
