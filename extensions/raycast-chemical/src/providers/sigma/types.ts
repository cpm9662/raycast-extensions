import type { ChemicalSearchQuery } from "../../types/chemical";

export interface SigmaParseSearchContext {
  query: ChemicalSearchQuery;
  searchUrl: string;
}

export interface SigmaParentProduct {
  url: string;
  productNumber?: string;
}
