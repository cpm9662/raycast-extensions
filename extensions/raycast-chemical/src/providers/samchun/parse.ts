import * as cheerio from "cheerio";
import { normalizeSearchText } from "../../core/normalize";
import type { ChemicalResult } from "../../types/chemical";
import { sanitizeCasNumber } from "../../utils/cas";
import { parsePriceText } from "../../utils/price";
import { parseStockState } from "../../utils/stock";
import {
  compactWhitespace,
  toAbsoluteUrl,
  toOptionalText,
} from "../../utils/text";
import { SAMCHUN_BASE_URL, buildSamchunSearchUrl } from "./constants";
import type { SamchunParseContext } from "./types";

const SAMCHUN_MAKER_LABELS = new Map<string, string>([
  ["SAM", "Samchun"],
  ["JUN", "Junsei"],
  ["KAN", "Kanto"],
  ["ALF", "Alfa Aesar"],
  ["JTB", "JT Baker"],
  ["STR", "Strem"],
  ["ACR", "Acros Organics"],
]);

function parseSamchunManufacturer(
  rawValue: string | undefined,
): string | undefined {
  const value = toOptionalText(rawValue);
  return value ? (SAMCHUN_MAKER_LABELS.get(value) ?? value) : undefined;
}

export function parseSamchunSearchResults(
  html: string,
  context: SamchunParseContext,
): ChemicalResult[] {
  const $ = cheerio.load(html);

  return $("table.listTable tr")
    .toArray()
    .reduce<ChemicalResult[]>((items, row) => {
      const cells = $(row).find("td");
      if (cells.length < 10) {
        return items;
      }

      const productCell = cells.eq(3);
      const productLink = productCell.find("a").first();
      const productName = toOptionalText(productCell.text());

      if (!productName) {
        return items;
      }

      const productCode = toOptionalText(cells.eq(1).text());
      const catalogNumber = productCode ?? toOptionalText(cells.eq(5).text());
      const price = parsePriceText(cells.eq(8).text());
      const stock = parseStockState(cells.eq(9).text());
      const href = productLink.attr("href");
      const productUrl = productCode
        ? buildSamchunSearchUrl(productCode)
        : href
          ? toAbsoluteUrl(href, SAMCHUN_BASE_URL)
          : undefined;

      items.push({
        id: `samchun:${productCode ?? href ?? normalizeSearchText(productName)}`,
        vendor: "Samchun",
        manufacturer: parseSamchunManufacturer(cells.eq(2).text()) ?? "Samchun",
        productName,
        normalizedProductName: normalizeSearchText(productName),
        casNumber: sanitizeCasNumber(cells.eq(0).text()),
        productCode,
        catalogNumber,
        grade: toOptionalText(cells.eq(6).text()),
        packSize: toOptionalText(cells.eq(7).text()),
        priceText: price.priceText,
        priceValue: price.priceValue,
        currency: price.currency,
        stockStatus: stock.stockStatus,
        stockText: stock.stockText,
        productUrl,
        searchUrl: context.searchUrl,
        rawSnippet: compactWhitespace($(row).text()),
        exactCasMatch: false,
        exactNameMatch: false,
        score: 0,
      } satisfies ChemicalResult);

      return items;
    }, []);
}
