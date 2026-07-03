import type { ReportPriority } from '../../domain/objectvalues/ReportPriority';
import type { ReportVerdict }  from '../../domain/objectvalues/ReportVerdict';

export interface ReportReasonDto {
  name: string;
  priority: ReportPriority;
}

export interface ReportPresentationDto {
  id: string;
  propertyTitle: string;
  lessorName: string;
  reason: ReportReasonDto;
  comment: string;
  verdict: ReportVerdict | null;
  createdAt: string;
  resolved: boolean;
}

export interface GetReportsResponseDto {
  success: boolean;
  data: ReportPresentationDto[];
  message: string;
  status: string;
}
