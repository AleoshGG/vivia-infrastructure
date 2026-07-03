import type { ReportDetailDto, PropertyContentDto, PropertyMediaDto } from '../dtos/ReportDetailDto';
import type { ReportDetail }     from '../../domain/entities/ReportDetail';
import type { ReportedProperty } from '../../domain/entities/ReportedProperty';

function reportedPropertyDtoToEntity(
  content: PropertyContentDto,
  contentMedia: PropertyMediaDto[] | null,
): ReportedProperty {
  return {
    content: {
      id:               content.id,
      title:            content.title,
      description:      content.description,
      areaM2:           content.areaM2,
      bedrooms:         content.bedrooms,
      bathrooms:        content.bathrooms,
      parkingSpaces:    content.parkingSpaces,
      constructionYear: content.constructionYear,
      listedPrice:      content.listedPrice,
      pricePerM2:       content.pricePerM2,
      createdAt:        content.createdAt,
      updatedAt:        content.updatedAt,
      propertyType: {
        id:   content.propertyType?.id ?? '',
        name: content.propertyType?.name ?? 'Propiedad',
      },
      address: {
        id:             content.address?.id ?? '',
        street:         content.address?.street ?? '',
        exteriorNumber: content.address?.exteriorNumber ?? '',
        interiorNumber: content.address?.interiorNumber ?? '',
        neighborhood: {
          id:         content.address?.neighborhood?.id ?? '',
          name:       content.address?.neighborhood?.name ?? '',
          postalCode: content.address?.neighborhood?.postalCode ?? '',
        },
      },
      amenities:        (content.amenities ?? []).map((a) => ({ id: a.id, name: a.name })),
      like:             content.like,
      lessor: content.lessor
        ? {
            id:              content.lessor.id,
            name:            content.lessor.name,
            paternalSurname: content.lessor.paternalSurname ?? '',
            maternalSurname: content.lessor.maternalSurname ?? '',
            photoUrl:        content.lessor.photoUrl ?? '',
          }
        : null,
      availableToRent:  content.availableToRent,
      condominium:      content.condominium,
    },
    contentMedia: (contentMedia ?? []).map((m) => ({
      id:             m.id,
      url:            m.url,
      type:           m.type,
      classification: m.classification,
    })),
  };
}

export function reportDetailDtoToEntity(dto: ReportDetailDto): ReportDetail {
  return {
    id:            dto.id,
    property:      dto.property?.content
      ? reportedPropertyDtoToEntity(dto.property.content, dto.property.contentMedia)
      : null,
    propertyTitle: dto.propertyTitle,
    lessor: {
      id:            dto.lessor.id,
      name:          dto.lessor.name,
      email:         dto.lessor.email,
      accountStatus: dto.lessor.accountStatus,
    },
    lessee: {
      id:    dto.lessee.id,
      name:  dto.lessee.name,
      email: dto.lessee.email,
    },
    reason:     { name: dto.reason.name, priority: dto.reason.priority },
    comment:    dto.comment,
    verdict:    dto.verdict ?? null,
    createdAt:  dto.createdAt,
    resolvedAt: dto.resolvedAt ?? null,
    resolved:   dto.resolved,
  };
}
