export type VendorName = "Daejung" | "Samchun" | "Sigma-Aldrich";

export type QueryKind = "cas" | "name";

export type StockStatus = "in_stock" | "out_of_stock" | "limited" | "unknown";

export interface ChemicalSearchQuery {
  raw: string;
  normalized: string;
  kind: QueryKind;
}

export interface ChemicalResult {
  id: string;
  vendor: VendorName;
  manufacturer?: string;
  productName: string;
  normalizedProductName: string;
  casNumber?: string;
  productCode?: string;
  catalogNumber?: string;
  grade?: string;
  purity?: string;
  packSize?: string;
  priceText?: string;
  priceValue?: number;
  currency?: string;
  stockStatus: StockStatus;
  stockText?: string;
  productUrl?: string;
  searchUrl: string;
  rawSnippet?: string;
  exactCasMatch: boolean;
  exactNameMatch: boolean;
  score: number;
}
