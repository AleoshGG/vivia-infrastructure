import type { PropertyType }    from '../objectvalues/PropertyType';
import type { PropertyAddress } from './PropertyAddress';
import type { PropertyAmenity } from './PropertyAmenity';
import type { PropertyLessor }  from './PropertyLessor';

export interface PropertyContent {
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
  propertyType: PropertyType;
  address: PropertyAddress;
  amenities: PropertyAmenity[];
  like: boolean;
  /** null si la cuenta del arrendador ya no existe o no viene poblada */
  lessor: PropertyLessor | null;
  availableToRent: boolean;
  condominium: boolean;
}
