import { compactWhitespace } from "./text";

const CAS_PATTERN = /\b\d{2,7}-\d{2}-\d\b/;

export function sanitizeCasNumber(
  rawCas: string | undefined,
): string | undefined {
  if (!rawCas) {
    return undefined;
  }

  const cleaned = compactWhitespace(rawCas);
  const match = cleaned.match(CAS_PATTERN);

  if (match) {
    return match[0];
  }

  if (cleaned.toLowerCase().includes("mixture")) {
    return "정보 없음";
  }

  return cleaned === "-" ? undefined : cleaned;
}
