import type { ChemicalSearchQuery } from "../../types/chemical";
import type { ProviderSearchResult } from "../../types/provider";
import { fetchText } from "../../utils/http";
import { buildSigmaSearchUrl } from "./constants";
import { parseSigmaProductPage, parseSigmaSearchResults } from "./parse";

export async function searchSigmaAldrich(
  query: ChemicalSearchQuery,
): Promise<ProviderSearchResult> {
  const searchUrl = buildSigmaSearchUrl(query);
  const searchHtml = await fetchText(searchUrl, {
    headers: {
      "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
    },
    timeoutMs: 25000,
  });

  const parentProducts = parseSigmaSearchResults(searchHtml);
  const parentPages = await Promise.allSettled(
    parentProducts.map(async (product) => {
      const html = await fetchText(product.url, {
        headers: {
          "Accept-Language": "ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7",
        },
        timeoutMs: 25000,
      });

      return parseSigmaProductPage(html, product.url, searchUrl);
    }),
  );

  return {
    vendor: "Sigma-Aldrich",
    items: parentPages.flatMap((result) =>
      result.status === "fulfilled" ? result.value : [],
    ),
  };
}
