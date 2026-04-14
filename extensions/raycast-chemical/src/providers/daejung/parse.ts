import * as cheerio from "cheerio";
import { normalizeSearchText } from "../../core/normalize";
import type { ChemicalResult } from "../../types/chemical";
import { sanitizeCasNumber } from "../../utils/cas";
import { parsePriceText } from "../../utils/price";
import { parseStockState } from "../../utils/stock";
import {
  compactWhitespace,
  extractSingleQuotedValue,
  imageSourceToLabel,
  toAbsoluteUrl,
  toOptionalText,
} from "../../utils/text";
import { DAEJUNG_SEARCH_PAGE_URL } from "./constants";
import type { DaejungParseContext } from "./types";

const RESTRICTED_SALE_TEXT =
  /\s*\(온라인 판매 금지 품목 - 영업점 문의요망\)\s*/gi;

function parseDaejungProductUrl(
  onclickValue: string | undefined,
): string | undefined {
  const relativePath = extractSingleQuotedValue(onclickValue);
  return relativePath
    ? toAbsoluteUrl(relativePath, DAEJUNG_SEARCH_PAGE_URL)
    : undefined;
}

function sanitizeDaejungProductName(
  rawName: string | undefined,
): string | undefined {
  return rawName
    ? toOptionalText(rawName.replace(RESTRICTED_SALE_TEXT, ""))
    : undefined;
}

export function parseDaejungSearchResults(
  html: string,
  context: DaejungParseContext,
): ChemicalResult[] {
  const $ = cheerio.load(html);

  return $("table.tbl-basic tbody tr")
    .toArray()
    .reduce<ChemicalResult[]>((items, row) => {
      const cells = $(row).find("td");
      if (cells.length < 9) {
        return items;
      }

      const makerCell = cells.eq(0);
      const productCell = cells.eq(3);
      const productLink = productCell.find("a").first();
      const productName = sanitizeDaejungProductName(productLink.text());

      if (!productName) {
        return items;
      }

      const price = parsePriceText(cells.eq(7).text());
      const stock = parseStockState(cells.eq(8).text());
      const productUrl = parseDaejungProductUrl(
        productLink.attr("onclick") ?? productLink.attr("onClick"),
      );
      const manufacturer =
        imageSourceToLabel(makerCell.find("img").attr("src")) ??
        toOptionalText(makerCell.text()) ??
        "Daejung";
      const catalogNumber = toOptionalText(cells.eq(2).text());
      const packSize = toOptionalText(cells.eq(5).text());

      items.push({
        id: `daejung:${catalogNumber ?? productUrl ?? normalizeSearchText(productName)}:${packSize ?? ""}`,
        vendor: "Daejung",
        manufacturer,
        productName,
        normalizedProductName: normalizeSearchText(productName),
        casNumber: sanitizeCasNumber(cells.eq(1).text()),
        catalogNumber,
        grade: toOptionalText(cells.eq(4).text()),
        purity: toOptionalText(productCell.find("span").last().text()),
        packSize,
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
