import type { ReportPresentationDto } from '../dtos/ReportPresentationDto';
import type { ReportPresentation }    from '../../domain/entities/ReportPresentation';

export function reportDtoToPresentation(dto: ReportPresentationDto): ReportPresentation {
  return {
    id:            dto.id,
    propertyTitle: dto.propertyTitle,
    lessorName:    dto.lessorName,
    reason:        { name: dto.reason.name, priority: dto.reason.priority },
    comment:       dto.comment,
    verdict:       dto.verdict ?? null,
    createdAt:     dto.createdAt,
    resolved:      dto.resolved,
  };
}
