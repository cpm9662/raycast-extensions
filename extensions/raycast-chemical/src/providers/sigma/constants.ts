import type { ChemicalSearchQuery } from "../../types/chemical";

export const SIGMA_BASE_URL = "https://www.sigmaaldrich.com";
export const SIGMA_LOCALE_PATH = "/KR/ko";
export const SIGMA_SEARCH_PAGE_SIZE = "12";

export function buildSigmaSearchUrl(query: ChemicalSearchQuery): string {
  const encodedPath = encodeURIComponent(query.raw);
  const params = new URLSearchParams({
    focus: "products",
    page: "1",
    perpage: SIGMA_SEARCH_PAGE_SIZE,
    sort: "relevance",
    term: query.raw,
    type: query.kind === "cas" ? "cas_number" : "product",
  });

  return `${SIGMA_BASE_URL}${SIGMA_LOCALE_PATH}/search/${encodedPath}?${params.toString()}`;
}

export function toSigmaAbsoluteUrl(pathOrUrl: string): string | undefined {
  try {
    return new URL(pathOrUrl, SIGMA_BASE_URL).toString();
  } catch {
    return undefined;
  }
}
