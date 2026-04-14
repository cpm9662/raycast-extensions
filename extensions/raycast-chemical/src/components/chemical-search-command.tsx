import {
  Action,
  ActionPanel,
  Keyboard,
  List,
  getPreferenceValues,
} from "@raycast/api";
import { useEffect, useMemo, useRef, useState } from "react";
import { SAMCHUN_SEARCH_ENDPOINT_URL } from "../providers/samchun/constants";
import type { ChemicalResult, VendorName } from "../types/chemical";
import type { ProviderSearchResult } from "../types/provider";
import { formatStockLabel } from "../utils/stock";

type CommandPreferences = {
  titleMaxLength?: string;
  showGrade?: boolean;
  showCatalogNumber?: boolean;
};

export type ChemicalSearchRunner = (
  rawQuery: string,
) => Promise<ProviderSearchResult[]>;

type ChemicalSearchCommandProps = {
  emptyTitle: string;
  emptyDescription: string;
  noResultsTitle?: string;
  noResultsDescription?: string;
  search: ChemicalSearchRunner;
  searchBarPlaceholder?: string;
  vendors: readonly VendorName[];
};

function isNonEmpty(value: string | undefined): value is string {
  return Boolean(value && value.trim().length > 0);
}

function parseTitleMaxLength(value: string | undefined): number {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    return 70;
  }

  return Math.max(10, Math.floor(parsed));
}

function truncateTitle(value: string, maxLength: number): string {
  return value.length > maxLength ? `${value.slice(0, maxLength - 1)}…` : value;
}

function buildSubtitle(item: ChemicalResult, showGrade: boolean): string {
  return [item.packSize, item.priceText, showGrade ? item.grade : undefined]
    .filter(isNonEmpty)
    .join(" · ");
}

function buildAccessories(
  item: ChemicalResult,
  showCatalogNumber: boolean,
): List.Item.Accessory[] {
  const accessories: List.Item.Accessory[] = [];

  if (item.casNumber) {
    accessories.push({ text: item.casNumber });
  }

  if (item.manufacturer) {
    accessories.push({ text: item.manufacturer });
  }

  if (showCatalogNumber && item.catalogNumber) {
    accessories.push({ text: item.catalogNumber });
  }

  const stockLabel = formatStockLabel(item.stockStatus, item.stockText);
  if (stockLabel) {
    accessories.push({ text: stockLabel });
  }

  return accessories;
}

function ResultItem({
  item,
  showGrade,
  showCatalogNumber,
  titleMaxLength,
}: {
  item: ChemicalResult;
  showGrade: boolean;
  showCatalogNumber: boolean;
  titleMaxLength: number;
}) {
  const copyPrimaryCode = item.productCode ?? item.catalogNumber;
  const copyPrimaryCodeTitle = item.productCode
    ? "Copy Product Code"
    : "Copy Catalog Number";

  return (
    <List.Item
      key={item.id}
      title={truncateTitle(item.productName, titleMaxLength)}
      subtitle={buildSubtitle(item, showGrade)}
      accessories={buildAccessories(item, showCatalogNumber)}
      keywords={[
        item.casNumber,
        item.productCode,
        item.catalogNumber,
        item.manufacturer,
      ].filter(isNonEmpty)}
      actions={
        <ActionPanel>
          {item.vendor === "Samchun" && item.productCode ? (
            <Action.OpenInBrowser
              title="Open Samchun Search Page"
              url={SAMCHUN_SEARCH_ENDPOINT_URL}
            />
          ) : (
            <Action.OpenInBrowser
              title="Open Product Page"
              url={item.productUrl ?? item.searchUrl}
            />
          )}
          {item.vendor !== "Samchun" ? (
            <Action.OpenInBrowser
              title="Open Search Result"
              url={item.searchUrl}
            />
          ) : null}
          {copyPrimaryCode ? (
            <Action.CopyToClipboard
              title={copyPrimaryCodeTitle}
              content={copyPrimaryCode}
              shortcut={{ modifiers: ["cmd", "shift"], key: "p" }}
            />
          ) : null}
          {item.casNumber ? (
            <Action.CopyToClipboard
              title="Copy CAS Number"
              content={item.casNumber}
              shortcut={Keyboard.Shortcut.Common.Copy}
            />
          ) : null}
        </ActionPanel>
      }
    />
  );
}

function ProviderSection({
  provider,
  showGrade,
  showCatalogNumber,
  titleMaxLength,
  isLoading,
}: {
  provider: ProviderSearchResult;
  showGrade: boolean;
  showCatalogNumber: boolean;
  titleMaxLength: number;
  isLoading: boolean;
}) {
  if (provider.error) {
    return (
      <List.Section title={provider.vendor}>
        <List.Item
          title={`${provider.vendor} search failed`}
          subtitle={provider.error}
          accessories={[{ text: "error" }]}
        />
      </List.Section>
    );
  }

  if (provider.items.length === 0 && !isLoading) {
    return (
      <List.Section title={provider.vendor}>
        <List.Item
          title="No matches"
          subtitle={`No ${provider.vendor} results for this query`}
        />
      </List.Section>
    );
  }

  return (
    <List.Section title={provider.vendor}>
      {provider.items.map((item) => (
        <ResultItem
          key={item.id}
          item={item}
          showGrade={showGrade}
          showCatalogNumber={showCatalogNumber}
          titleMaxLength={titleMaxLength}
        />
      ))}
    </List.Section>
  );
}

function useChemicalSearch(
  searchText: string,
  search: ChemicalSearchRunner,
): {
  providers: ProviderSearchResult[] | undefined;
  isLoading: boolean;
} {
  const [providers, setProviders] = useState<ProviderSearchResult[]>();
  const [isLoading, setIsLoading] = useState(false);
  const requestIdRef = useRef(0);

  useEffect(() => {
    const query = searchText.trim();

    if (!query) {
      setProviders(undefined);
      setIsLoading(false);
      return;
    }

    const requestId = ++requestIdRef.current;
    setIsLoading(true);

    search(query)
      .then((nextProviders) => {
        if (requestId === requestIdRef.current) {
          setProviders(nextProviders);
        }
      })
      .finally(() => {
        if (requestId === requestIdRef.current) {
          setIsLoading(false);
        }
      });
  }, [searchText, search]);

  return { providers, isLoading };
}

export function ChemicalSearchCommand({
  emptyTitle,
  emptyDescription,
  noResultsTitle = "No results",
  noResultsDescription = "Try a different spelling, synonym, or CAS number.",
  search,
  searchBarPlaceholder = "Search by chemical name or CAS number",
  vendors,
}: ChemicalSearchCommandProps) {
  const preferences = getPreferenceValues<CommandPreferences>();
  const [searchText, setSearchText] = useState("");
  const { providers: resultProviders, isLoading } = useChemicalSearch(
    searchText,
    search,
  );
  const titleMaxLength = useMemo(
    () => parseTitleMaxLength(preferences.titleMaxLength),
    [preferences.titleMaxLength],
  );
  const showGrade = preferences.showGrade ?? true;
  const showCatalogNumber = preferences.showCatalogNumber ?? true;

  const providers = useMemo(() => {
    const providerMap = new Map<VendorName, ProviderSearchResult>();

    vendors.forEach((vendor) => {
      providerMap.set(vendor, { vendor, items: [] });
    });

    resultProviders?.forEach((provider) => {
      providerMap.set(provider.vendor, provider);
    });

    return vendors.map((vendor) => providerMap.get(vendor)!);
  }, [resultProviders, vendors]);

  const hasQuery = searchText.trim().length > 0;
  const hasAnyItems = providers.some((provider) => provider.items.length > 0);
  const hasAnyErrors = providers.some((provider) => provider.error);

  return (
    <List
      isLoading={isLoading}
      onSearchTextChange={setSearchText}
      searchBarPlaceholder={searchBarPlaceholder}
      throttle
    >
      {!hasQuery ? (
        <List.EmptyView title={emptyTitle} description={emptyDescription} />
      ) : !isLoading && !hasAnyItems && !hasAnyErrors ? (
        <List.EmptyView
          title={noResultsTitle}
          description={noResultsDescription}
        />
      ) : null}

      {providers.map((provider) => (
        <ProviderSection
          key={provider.vendor}
          provider={provider}
          showGrade={showGrade}
          showCatalogNumber={showCatalogNumber}
          titleMaxLength={titleMaxLength}
          isLoading={isLoading}
        />
      ))}
    </List>
  );
}
