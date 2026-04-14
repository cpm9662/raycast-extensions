import type {
  ChemicalResult,
  ChemicalSearchQuery,
  VendorName,
} from "./chemical";

export interface ProviderSearchResult {
  vendor: VendorName;
  items: ChemicalResult[];
  error?: string;
}

export interface SearchAllResult {
  query: ChemicalSearchQuery;
  providers: ProviderSearchResult[];
  items: ChemicalResult[];
}
