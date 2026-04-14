import * as cheerio from "cheerio";
import { normalizeSearchText } from "../../core/normalize";
import type { ChemicalResult, StockStatus } from "../../types/chemical";
import { compactWhitespace, toOptionalText } from "../../utils/text";
import type { SigmaParentProduct } from "./types";

interface SigmaVariant {
  sku: string;
  availability?: string;
}

interface ParsedSigmaStock {
  stockStatus: StockStatus;
  stockText?: string;
  sortOrder: number;
  dateValue?: string;
}

function uniqueByUrl(items: SigmaParentProduct[]): SigmaParentProduct[] {
  const seen = new Set<string>();
  const deduped: SigmaParentProduct[] = [];

  for (const item of items) {
    if (seen.has(item.url)) {
      continue;
    }

    seen.add(item.url);
    deduped.push(item);
  }

  return deduped;
}

function normalizeSigmaSku(value: string | undefined): string | undefined {
  const cleaned = value?.replace(/[^A-Za-z0-9]/g, "").toUpperCase();
  return cleaned && /\d/.test(cleaned) ? cleaned : undefined;
}

function isSigmaSkuCandidate(
  value: string | undefined,
  parentPrefix?: string,
): value is string {
  const text = toOptionalText(value);
  if (!text || !/^[A-Za-z0-9.-]+$/.test(text) || !/\d/.test(text)) {
    return false;
  }

  const normalized = normalizeSigmaSku(text);
  if (!normalized) {
    return false;
  }

  if (parentPrefix) {
    return normalized.startsWith(parentPrefix) && normalized !== parentPrefix;
  }

  return normalized.length >= 6;
}

function isAvailabilityText(value: string | undefined): value is string {
  const text = toOptionalText(value);
  if (!text) {
    return false;
  }

  return /today|available to ship|estimated to ship|expected to ship|ships?\s+today|ships?\s+on|오늘 배송|배송 가능|배송 예정|\d{4}\s*년\s*\d{1,2}\s*월\s*\d{1,2}\s*일(?:에)?\s*배송|예상 입고일|재고 없음|품절|unavailable|out of stock/i.test(
    text,
  );
}

function formatIsoDate(year: string, month: string, day: string): string {
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

function parseEnglishDate(value: string): string | undefined {
  const match = value.match(
    /(?:estimated|expected)\s+to\s+ship(?:\s+on)?\s+([A-Za-z]+)\s+(\d{1,2}),\s*(\d{4})/i,
  );
  if (!match) {
    return undefined;
  }

  const monthMap: Record<string, string> = {
    january: "01",
    february: "02",
    march: "03",
    april: "04",
    may: "05",
    june: "06",
    july: "07",
    august: "08",
    september: "09",
    october: "10",
    november: "11",
    december: "12",
  };

  const month = monthMap[match[1].toLowerCase()];
  if (!month) {
    return undefined;
  }

  return formatIsoDate(match[3], month, match[2]);
}

function parseSigmaStock(
  availabilityText: string | undefined,
): ParsedSigmaStock {
  const text = toOptionalText(availabilityText);
  if (!text) {
    return { stockStatus: "unknown", sortOrder: 99 };
  }

  if (
    /today|ships?\s+today|오늘 배송(?:\s|$)|오늘 배송 가능|오늘 배송 예정/i.test(
      text,
    )
  ) {
    return { stockStatus: "in_stock", stockText: "Today", sortOrder: 0 };
  }

  const koreanDate = text.match(
    /(\d{4})\s*년\s*(\d{1,2})\s*월\s*(\d{1,2})\s*일(?:에)?\s*배송/,
  );
  if (koreanDate) {
    const dateValue = formatIsoDate(
      koreanDate[1],
      koreanDate[2],
      koreanDate[3],
    );
    return {
      stockStatus: "in_stock",
      stockText: dateValue,
      sortOrder: 1,
      dateValue,
    };
  }

  const englishDate = parseEnglishDate(text);
  if (englishDate) {
    return {
      stockStatus: "in_stock",
      stockText: englishDate,
      sortOrder: 1,
      dateValue: englishDate,
    };
  }

  if (/available to ship/i.test(text)) {
    return {
      stockStatus: "in_stock",
      stockText: "Available",
      sortOrder: 2,
    };
  }

  if (/out of stock|unavailable|재고 없음|품절/i.test(text)) {
    return { stockStatus: "out_of_stock", stockText: "X", sortOrder: 4 };
  }

  return { stockStatus: "unknown", stockText: text, sortOrder: 99 };
}

function compareParsedSigmaStock(
  left: ParsedSigmaStock,
  right: ParsedSigmaStock,
): number {
  if (left.sortOrder !== right.sortOrder) {
    return left.sortOrder - right.sortOrder;
  }

  if (left.dateValue && right.dateValue) {
    return left.dateValue.localeCompare(right.dateValue);
  }

  if (left.dateValue) {
    return -1;
  }

  if (right.dateValue) {
    return 1;
  }

  return 0;
}

function pickBestSigmaStock(
  availabilityTexts: Array<string | undefined>,
): ParsedSigmaStock {
  const parsed = availabilityTexts
    .map((text) => parseSigmaStock(text))
    .filter(
      (stock, _index, items) =>
        !(
          stock.stockStatus === "unknown" &&
          !stock.stockText &&
          items.some((candidate) => candidate.stockStatus !== "unknown")
        ),
    );

  if (parsed.length === 0) {
    return parseSigmaStock(undefined);
  }

  return parsed.reduce((best, current) =>
    compareParsedSigmaStock(current, best) < 0 ? current : best,
  );
}

function parseAboutValue(
  $: cheerio.CheerioAPI,
  label: string,
): string | undefined {
  const labelElement = $("h3, h4, dt, th")
    .toArray()
    .find((element) => compactWhitespace($(element).text()) === label);

  if (!labelElement) {
    return undefined;
  }

  const next = $(labelElement).next();
  if (next.length > 0) {
    const value = toOptionalText(next.text());
    if (value) {
      return value;
    }
  }

  const parentRow = $(labelElement).closest("tr");
  if (parentRow.length > 0) {
    const cells = parentRow.find("td");
    if (cells.length > 0) {
      return toOptionalText(cells.first().text());
    }
  }

  return undefined;
}

function getBodyLines($: cheerio.CheerioAPI): string[] {
  return $("body")
    .text()
    .split(/\r?\n/)
    .map((line) => compactWhitespace(line))
    .filter((line) => line.length > 0 && line !== "* * *");
}

function parseCasFromLines(lines: string[]): string | undefined {
  const labelIndex = lines.findIndex((line) =>
    /^(CAS Number|CAS No\.?|CAS 번호):?$/i.test(line),
  );
  if (labelIndex >= 0) {
    const nextValue = lines
      .slice(labelIndex + 1)
      .find((line) => /\d{2,7}-\d{2}-\d/.test(line));
    if (nextValue) {
      return nextValue.match(/\d{2,7}-\d{2}-\d/)?.[0];
    }
  }

  return lines.join(" ").match(/\b\d{2,7}-\d{2}-\d\b/)?.[0];
}

function buildVariantsFromSkuSections(
  lines: string[],
  parentPrefix?: string,
): SigmaVariant[] {
  const skuIndices = lines
    .map((line, index) =>
      isSigmaSkuCandidate(line, parentPrefix) ? index : -1,
    )
    .filter((index) => index >= 0);

  return skuIndices
    .map((startIndex, itemIndex) => {
      const sku = lines[startIndex];
      const endIndex =
        skuIndices[itemIndex + 1] ?? Math.min(lines.length, startIndex + 25);
      const sectionLines = lines.slice(startIndex + 1, endIndex);

      return {
        sku,
        availability: sectionLines.find(isAvailabilityText),
      };
    })
    .filter((item) => Boolean(item.availability));
}

function buildVariantsFromAllLines(
  lines: string[],
  parentPrefix?: string,
): SigmaVariant[] {
  const seen = new Set<string>();
  const variants: SigmaVariant[] = [];

  for (const line of lines) {
    const matches = line.match(/[A-Za-z0-9.-]+/g) ?? [];
    for (const part of matches) {
      if (!isSigmaSkuCandidate(part, parentPrefix)) {
        continue;
      }

      const sku = part.trim();
      if (seen.has(sku)) {
        continue;
      }

      seen.add(sku);
      variants.push({ sku });
    }
  }

  return variants;
}

function mergeVariants(
  primary: SigmaVariant[],
  fallback: SigmaVariant[],
): SigmaVariant[] {
  const merged = new Map<string, SigmaVariant>();

  for (const item of [...primary, ...fallback]) {
    const key = normalizeSigmaSku(item.sku);
    if (!key) {
      continue;
    }

    const existing = merged.get(key);
    if (!existing) {
      merged.set(key, item);
      continue;
    }

    merged.set(key, {
      sku: existing.sku,
      availability: existing.availability ?? item.availability,
    });
  }

  return [...merged.values()];
}

export function parseSigmaSearchResults(html: string): SigmaParentProduct[] {
  const $ = cheerio.load(html);

  const candidates = $("a[href*='/product/']")
    .toArray()
    .reduce<SigmaParentProduct[]>((items, element) => {
      const href = $(element).attr("href");
      if (!href) {
        return items;
      }

      const absoluteUrl = new URL(
        href,
        "https://www.sigmaaldrich.com",
      ).toString();
      const productNumberMatch = absoluteUrl.match(
        /\/product\/[^/]+\/([^/?#]+)/i,
      );

      items.push({
        url: absoluteUrl,
        productNumber: productNumberMatch?.[1]?.toUpperCase(),
      });

      return items;
    }, []);

  return uniqueByUrl(candidates).slice(0, 8);
}

export function parseSigmaProductPage(
  html: string,
  productUrl: string,
  searchUrl: string,
): ChemicalResult[] {
  const $ = cheerio.load(html);
  const lines = getBodyLines($);
  const bodyText = compactWhitespace(lines.join(" "));
  const productName =
    toOptionalText($("h1").first().text()) ?? toOptionalText($("title").text());

  if (!productName) {
    return [];
  }

  const grade = toOptionalText($("h2").first().text());
  const manufacturer =
    toOptionalText(
      $("img[alt*='Sigma-Aldrich'], img[alt*='MilliporeSigma']")
        .first()
        .attr("alt"),
    )
      ?.replace("Image:", "")
      .trim() ?? "Sigma-Aldrich";

  const casNumber =
    parseAboutValue($, "CAS Number:") ??
    parseAboutValue($, "CAS No.:") ??
    parseAboutValue($, "CAS 번호:") ??
    parseCasFromLines(lines);

  const parentNumberMatch = productUrl.match(/\/product\/[^/]+\/([^/?#]+)/i);
  const parentNumber = parentNumberMatch?.[1]?.toUpperCase();
  const parentPrefix = normalizeSigmaSku(parentNumber);

  const sectionVariants = buildVariantsFromSkuSections(lines, parentPrefix);
  const allLineVariants = buildVariantsFromAllLines(lines, parentPrefix);
  const variants = mergeVariants(sectionVariants, allLineVariants);
  const pageAvailabilityTexts = lines.filter(isAvailabilityText);
  const stock = pickBestSigmaStock([
    ...variants.map((variant) => variant.availability),
    ...pageAvailabilityTexts,
  ]);
  const representativeCode = parentNumber ?? variants[0]?.sku;

  return [
    {
      id: `sigma:${representativeCode ?? normalizeSearchText(productName)}`,
      vendor: "Sigma-Aldrich",
      manufacturer,
      productName,
      normalizedProductName: normalizeSearchText(productName),
      casNumber,
      productCode: representativeCode,
      catalogNumber: representativeCode,
      grade,
      packSize: undefined,
      priceText: undefined,
      priceValue: undefined,
      currency: undefined,
      stockStatus: stock.stockStatus,
      stockText: stock.stockStatus === "unknown" ? undefined : stock.stockText,
      productUrl,
      searchUrl,
      rawSnippet: bodyText,
      exactCasMatch: false,
      exactNameMatch: false,
      score: 0,
    } satisfies ChemicalResult,
  ];
}
