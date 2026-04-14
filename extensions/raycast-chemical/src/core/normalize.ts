export const CAS_NUMBER_PATTERN = /^\d{2,7}-\d{2}-\d$/;

export function compactWhitespace(value: string): string {
  return value
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeSearchText(value: string): string {
  return compactWhitespace(value)
    .toLowerCase()
    .replace(/[()]/g, " ")
    .replace(/[.,/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeCasNumber(value: string): string {
  return compactWhitespace(value).replace(/\s+/g, "");
}

export function isCasNumber(value: string): boolean {
  return CAS_NUMBER_PATTERN.test(normalizeCasNumber(value));
}
