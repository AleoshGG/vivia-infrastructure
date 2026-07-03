import type { ReportPriority } from './ReportPriority';

export interface ReportReason {
  name: string;
  priority: ReportPriority;
}
