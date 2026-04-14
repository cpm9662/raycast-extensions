import type { ChemicalSearchQuery } from "../types/chemical";
import {
  isCasNumber,
  normalizeCasNumber,
  normalizeSearchText,
} from "./normalize";

export function detectChemicalQuery(rawInput: string): ChemicalSearchQuery {
  const raw = rawInput.trim();

  if (isCasNumber(raw)) {
    return {
      raw,
      normalized: normalizeCasNumber(raw),
      kind: "cas",
    };
  }

  return {
    raw,
    normalized: normalizeSearchText(raw),
    kind: "name",
  };
}
