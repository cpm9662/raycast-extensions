import type { StockStatus } from "../types/chemical";
import { compactWhitespace } from "./text";

export interface ParsedStock {
  stockStatus: StockStatus;
  stockText?: string;
}

export function parseStockState(rawStock: string | undefined): ParsedStock {
  const cleaned = rawStock ? compactWhitespace(rawStock) : "";

  if (!cleaned || cleaned === "-") {
    return { stockStatus: "unknown" };
  }

  const lowered = cleaned.toLowerCase();
  if (
    lowered === "x" ||
    lowered === "no" ||
    lowered.includes("out of stock") ||
    lowered.includes("품절")
  ) {
    return {
      stockStatus: "out_of_stock",
      stockText: "X",
    };
  }

  if (lowered.includes("available") || lowered.includes("in stock")) {
    return {
      stockStatus: "in_stock",
      stockText: cleaned,
    };
  }

  const quantityMatch = cleaned.match(/\d+/);
  if (quantityMatch) {
    const quantity = Number(quantityMatch[0]);

    if (quantity === 0) {
      return {
        stockStatus: "out_of_stock",
        stockText: "X",
      };
    }

    return {
      stockStatus: quantity <= 5 ? "limited" : "in_stock",
      stockText: String(quantity),
    };
  }

  return {
    stockStatus: "unknown",
    stockText: cleaned,
  };
}

export function formatStockLabel(
  stockStatus: StockStatus,
  stockText?: string,
): string | undefined {
  if (stockText) {
    return stockText;
  }

  switch (stockStatus) {
    case "in_stock":
      return "In stock";
    case "limited":
      return "Limited";
    case "out_of_stock":
      return "Out of stock";
    default:
      return undefined;
  }
}
