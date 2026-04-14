import type { ChemicalResult, ChemicalSearchQuery } from "../types/chemical";
import { normalizeCasNumber, normalizeSearchText } from "./normalize";

function scoreResult(
  result: ChemicalResult,
  query: ChemicalSearchQuery,
): ChemicalResult {
  let score = 0;
  let exactCasMatch = false;
  let exactNameMatch = false;

  const normalizedProductName = normalizeSearchText(result.productName);
  const normalizedCas = result.casNumber
    ? normalizeCasNumber(result.casNumber)
    : undefined;

  if (
    query.kind === "cas" &&
    normalizedCas &&
    normalizedCas === query.normalized
  ) {
    exactCasMatch = true;
    score += 100;
  }

  if (query.kind === "name") {
    if (normalizedProductName === query.normalized) {
      exactNameMatch = true;
      score += 70;
    } else if (normalizedProductName.includes(query.normalized)) {
      score += 40;
    }
  }

  if (result.stockStatus === "in_stock") {
    score += 5;
  } else if (result.stockStatus === "limited") {
    score += 2;
  } else if (result.stockStatus === "out_of_stock") {
    score -= 2;
  }

  return {
    ...result,
    normalizedProductName,
    exactCasMatch,
    exactNameMatch,
    score,
  };
}

export function rankChemicalResults(
  items: ChemicalResult[],
  query: ChemicalSearchQuery,
): ChemicalResult[] {
  return items
    .map((item) => scoreResult(item, query))
    .sort((left, right) => {
      if (right.score !== left.score) {
        return right.score - left.score;
      }

      if (
        (left.priceValue ?? Number.MAX_SAFE_INTEGER) !==
        (right.priceValue ?? Number.MAX_SAFE_INTEGER)
      ) {
        return (
          (left.priceValue ?? Number.MAX_SAFE_INTEGER) -
          (right.priceValue ?? Number.MAX_SAFE_INTEGER)
        );
      }

      return left.productName.localeCompare(right.productName);
    });
}
