import type { ReportVerdict } from '../../domain/objectvalues/ReportVerdict';

export interface ApplyVerdictRequestDto {
  verdict: ReportVerdict;
}

export interface ApplyVerdictResponseDto {
  success: boolean;
  data: Record<string, never>;
  message: string;
  status: string;
}
