import type { Neighborhood } from './Neighborhood';

export interface PropertyAddress {
  id: string;
  street: string;
  exteriorNumber: string;
  interiorNumber: string;
  neighborhood: Neighborhood;
}
