import type { PropertyContent } from './PropertyContent';
import type { PropertyMedia }   from './PropertyMedia';

export interface ReportedProperty {
  content: PropertyContent;
  contentMedia: PropertyMedia[];
}
