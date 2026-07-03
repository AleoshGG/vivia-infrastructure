import type { ReportVerdict } from '../../domain/objectvalues/ReportVerdict';
import type { ReportReasonDto } from './ReportPresentationDto';

export interface PropertyTypeDto {
  id: string;
  name: string;
}

export interface NeighborhoodDto {
  id: string;
  name: string;
  postalCode: string;
}

export interface PropertyAddressDto {
  id: string;
  street: string;
  exteriorNumber: string;
  interiorNumber: string;
  neighborhood: NeighborhoodDto;
}

export interface PropertyAmenityDto {
  id: string;
  name: string;
}

export interface PropertyLessorDto {
  id: string;
  name: string;
  paternalSurname: string;
  maternalSurname: string;
  photoUrl: string;
}

export interface PropertyContentDto {
  id: string;
  title: string;
  description: string;
  areaM2: number;
  bedrooms: number;
  bathrooms: number;
  parkingSpaces: number;
  constructionYear: number;
  listedPrice: number;
  pricePerM2: number;
  createdAt: string;
  updatedAt: string;
  propertyType: PropertyTypeDto | null;
  address: PropertyAddressDto | null;
  amenities: PropertyAmenityDto[] | null;
  like: boolean;
  lessor: PropertyLessorDto | null;
  availableToRent: boolean;
  condominium: boolean;
}

export interface PropertyMediaDto {
  id: string;
  url: string;
  type: string;
  classification: string;
}

export interface ReportedPropertyDto {
  content: PropertyContentDto | null;
  contentMedia: PropertyMediaDto[] | null;
}

export interface ReportLessorDto {
  id: string;
  name: string;
  email: string;
  accountStatus: string;
}

export interface ReportLesseeDto {
  id: string;
  name: string;
  email: string;
}

export interface ReportDetailDto {
  id: string;
  property: ReportedPropertyDto | null;
  propertyTitle: string;
  lessor: ReportLessorDto;
  lessee: ReportLesseeDto;
  reason: ReportReasonDto;
  comment: string;
  verdict: ReportVerdict | null;
  createdAt: string;
  resolvedAt: string | null;
  resolved: boolean;
}

export interface GetReportDetailResponseDto {
  success: boolean;
  data: ReportDetailDto;
  message: string;
  status: string;
}
