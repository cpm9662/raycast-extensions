import type { ChemicalSearchQuery } from "../../types/chemical";
import type { ProviderSearchResult } from "../../types/provider";
import { fetchText } from "../../utils/http";
import {
  SAMCHUN_DIVISION,
  SAMCHUN_SEARCH_ENDPOINT_URL,
  buildSamchunSearchUrl,
} from "./constants";
import { parseSamchunSearchResults } from "./parse";

function buildSearchUrl(query: ChemicalSearchQuery): string {
  return buildSamchunSearchUrl(query.raw);
}

export async function searchSamchun(
  query: ChemicalSearchQuery,
): Promise<ProviderSearchResult> {
  const searchUrl = buildSearchUrl(query);
  const body = new URLSearchParams({
    s_keyword: query.raw,
    s_division: SAMCHUN_DIVISION,
  });

  const html = await fetchText(SAMCHUN_SEARCH_ENDPOINT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Origin: "http://www.samchun.com",
      Referer: SAMCHUN_SEARCH_ENDPOINT_URL,
    },
    body: body.toString(),
  });

  return {
    vendor: "Samchun",
    items: parseSamchunSearchResults(html, { query, searchUrl }),
  };
}
