import type { ChemicalSearchQuery } from "../../types/chemical";
import type { ProviderSearchResult } from "../../types/provider";
import { fetchText } from "../../utils/http";
import {
  DAEJUNG_SEARCH_ENDPOINT_URL,
  DAEJUNG_SEARCH_PAGE_URL,
} from "./constants";
import { parseDaejungSearchResults } from "./parse";

function buildSearchUrl(query: ChemicalSearchQuery): string {
  return `${DAEJUNG_SEARCH_PAGE_URL}?search_value=${encodeURIComponent(query.raw)}`;
}

function buildEndpointUrl(query: ChemicalSearchQuery): string {
  const params = new URLSearchParams({
    page: "1",
    list_per_page: "10",
    page_scale: "10",
    S_STR1: query.raw,
    S_KINDS: "",
    S_KINDS2: "",
    S_ORDER: "",
    S_ADESC: "",
    S_MAKER: "",
    S_LIKE: "",
    cNav: "",
  });

  return `${DAEJUNG_SEARCH_ENDPOINT_URL}?${params.toString()}`;
}

export async function searchDaejung(
  query: ChemicalSearchQuery,
): Promise<ProviderSearchResult> {
  const searchUrl = buildSearchUrl(query);
  const html = await fetchText(buildEndpointUrl(query), {
    headers: {
      Referer: searchUrl,
    },
  });

  return {
    vendor: "Daejung",
    items: parseDaejungSearchResults(html, { query, searchUrl }),
  };
}
