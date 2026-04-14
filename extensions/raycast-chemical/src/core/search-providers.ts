import { searchDaejung } from "../providers/daejung/search";
import { searchSamchun } from "../providers/samchun/search";
import { searchSigmaAldrich } from "../providers/sigma/search";
import type { ChemicalSearchQuery, VendorName } from "../types/chemical";
import type { ProviderSearchResult, SearchAllResult } from "../types/provider";
import { getErrorMessage } from "../utils/errors";
import { detectChemicalQuery } from "./detect-query";
import { rankChemicalResults } from "./rank-results";

const providerSearchers: Record<
  VendorName,
  (query: ChemicalSearchQuery) => Promise<ProviderSearchResult>
> = {
  Daejung: searchDaejung,
  Samchun: searchSamchun,
  "Sigma-Aldrich": searchSigmaAldrich,
};

export const ALL_VENDORS: VendorName[] = [
  "Daejung",
  "Samchun",
  "Sigma-Aldrich",
];

async function runProviderSearches(
  query: ChemicalSearchQuery,
  vendors: readonly VendorName[],
): Promise<ProviderSearchResult[]> {
  const settled = await Promise.allSettled(
    vendors.map((vendor) => providerSearchers[vendor](query)),
  );

  return settled.map((result, index) => {
    const vendor = vendors[index];

    if (result.status === "fulfilled") {
      return {
        ...result.value,
        items: rankChemicalResults(result.value.items, query),
      };
    }

    return {
      vendor,
      items: [],
      error: getErrorMessage(result.reason, `${vendor} search failed`),
    };
  });
}

export async function searchChemicalProviders(
  rawQuery: string,
  vendors: readonly VendorName[],
): Promise<ProviderSearchResult[]> {
  const query = detectChemicalQuery(rawQuery);
  return runProviderSearches(query, vendors);
}

export async function searchAllChemicals(
  rawQuery: string,
): Promise<SearchAllResult> {
  const query = detectChemicalQuery(rawQuery);
  const providers = await runProviderSearches(query, ALL_VENDORS);

  return {
    query,
    providers,
    items: providers.flatMap((provider) => provider.items),
  };
}
