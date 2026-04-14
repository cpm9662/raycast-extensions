import { compactWhitespace } from "./text";

export interface ParsedPrice {
  priceText?: string;
  priceValue?: number;
  currency?: string;
}

export function parsePriceText(rawPrice: string | undefined): ParsedPrice {
  const cleaned = rawPrice ? compactWhitespace(rawPrice) : "";

  if (!cleaned || cleaned === "-") {
    return {};
  }

  const numericMatch = cleaned.match(/\d[\d,]*(?:\.\d+)?/);
  if (!numericMatch) {
    return { priceText: cleaned };
  }

  const normalizedNumber = numericMatch[0].replace(/,/g, "");
  const priceValue = Number(normalizedNumber);

  if (!Number.isFinite(priceValue)) {
    return { priceText: cleaned };
  }

  if (cleaned.includes("$")) {
    return {
      priceText: cleaned,
      priceValue,
      currency: "USD",
    };
  }

  if (cleaned.includes("₩") || cleaned.includes("원")) {
    return {
      priceText: cleaned,
      priceValue,
      currency: "KRW",
    };
  }

  return {
    priceText: cleaned,
    priceValue,
  };
}
