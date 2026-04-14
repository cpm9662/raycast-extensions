import path from "node:path";

const MAKER_LABELS = new Map<string, string>([
  ["dj 2", "Daejung"],
  ["dj_2", "Daejung"],
  ["dj 1", "Daejung"],
  ["dj_1", "Daejung"],
  ["fisher 1", "Fisher"],
  ["fisher_1", "Fisher"],
  ["partner logo23", "Junsei"],
  ["partner_logo23", "Junsei"],
  ["kanto", "Kanto"],
  ["merck", "Merck"],
  ["partner logo18", "Fujifilm"],
  ["partner_logo18", "Fujifilm"],
  ["yak", "Yakuri"],
]);

export function compactWhitespace(value: string): string {
  return value
    .replace(/\u00a0/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function toOptionalText(
  value: string | null | undefined,
): string | undefined {
  if (!value) {
    return undefined;
  }

  const cleaned = compactWhitespace(value);
  return cleaned.length > 0 ? cleaned : undefined;
}

export function extractSingleQuotedValue(
  value: string | undefined,
): string | undefined {
  const match = value?.match(/'([^']+)'/);
  return match?.[1];
}

export function toAbsoluteUrl(
  relativeOrAbsoluteUrl: string,
  baseUrl: string,
): string | undefined {
  try {
    return new URL(relativeOrAbsoluteUrl, baseUrl).toString();
  } catch {
    return undefined;
  }
}

export function imageSourceToLabel(
  source: string | undefined,
): string | undefined {
  if (!source) {
    return undefined;
  }

  const decoded = decodeURIComponent(source);
  const filename = path.basename(decoded).replace(path.extname(decoded), "");
  const normalized = filename.toLowerCase();

  return (
    MAKER_LABELS.get(normalized) ??
    MAKER_LABELS.get(normalized.replace(/[_-]+/g, " ")) ??
    filename
  );
}
