import { httpClient, sseClient } from '@/core/di';
import { ReportsException } from '../../domain/exceptions/ReportsException';
import type { IReportsRepository } from '../../domain/repositories/IReportsRepository';
import type { ReportPresentation } from '../../domain/entities/ReportPresentation';
import type { ReportDetail } from '../../domain/entities/ReportDetail';
import type { ReportVerdict } from '../../domain/objectvalues/ReportVerdict';
import type { ApplyVerdictRequestDto, ApplyVerdictResponseDto } from '../dtos/ApplyVerdictDto';
import type { GetReportsResponseDto, ReportPresentationDto } from '../dtos/ReportPresentationDto';
import type { GetReportDetailResponseDto } from '../dtos/ReportDetailDto';
import { reportDtoToPresentation } from '../mappers/reportDtoToPresentation';
import { reportDetailDtoToEntity } from '../mappers/reportDetailDtoToEntity';

export class ApiReportsRepository implements IReportsRepository {
  async getPendingReports(): Promise<ReportPresentation[]> {
    const res = await httpClient.get<GetReportsResponseDto>('/admin/reports');

    if (!res.success) {
      throw new ReportsException(res.message ?? 'Error al obtener los reportes.');
    }

    return res.data.map(reportDtoToPresentation);
  }

  async getReportDetail(id: string): Promise<ReportDetail> {
    const res = await httpClient.get<GetReportDetailResponseDto>(`/admin/reports/${id}`);

    if (!res.success) {
      throw new ReportsException(res.message ?? 'Error al obtener el detalle del reporte.');
    }

    return reportDetailDtoToEntity(res.data);
  }

  async getLessorReportHistory(lessorId: string): Promise<ReportPresentation[]> {
    const res = await httpClient.get<GetReportsResponseDto>(`/admin/reports/history/${lessorId}`);

    if (!res.success) {
      throw new ReportsException(res.message ?? 'Error al obtener el historial del arrendador.');
    }

    return res.data.map(reportDtoToPresentation);
  }

  async applyVerdict(id: string, verdict: ReportVerdict): Promise<void> {
    const body: ApplyVerdictRequestDto = { verdict };
    const res = await httpClient.patch<ApplyVerdictResponseDto>(`/admin/reports/${id}`, body);

    if (!res.success) {
      throw new ReportsException(res.message ?? 'Error al aplicar el veredicto.');
    }
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
