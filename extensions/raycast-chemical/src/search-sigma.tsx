import { ChemicalSearchCommand } from "./components/chemical-search-command";
import { searchChemicalProviders } from "./core/search-providers";

const SIGMA_VENDOR = ["Sigma-Aldrich"] as const;
const searchSigmaOnly = (rawQuery: string) =>
  searchChemicalProviders(rawQuery, SIGMA_VENDOR);

export default function SearchSigmaCommand() {
  return (
    <ChemicalSearchCommand
      vendors={SIGMA_VENDOR}
      search={searchSigmaOnly}
      emptyTitle="Search Sigma-Aldrich catalog"
      emptyDescription="Enter an English chemical name or CAS number to query Sigma-Aldrich only."
      noResultsDescription="Try a different spelling, synonym, or CAS number for Sigma-Aldrich."
    />
  );
}
