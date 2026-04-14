import { ChemicalSearchCommand } from "./components/chemical-search-command";
import { searchChemicalProviders } from "./core/search-providers";

const DAEJUNG_VENDOR = ["Daejung"] as const;
const searchDaejungOnly = (rawQuery: string) =>
  searchChemicalProviders(rawQuery, DAEJUNG_VENDOR);

export default function SearchDaejungCommand() {
  return (
    <ChemicalSearchCommand
      vendors={DAEJUNG_VENDOR}
      search={searchDaejungOnly}
      emptyTitle="Search Daejung catalog"
      emptyDescription="Enter an English chemical name or CAS number to query Daejung only."
      noResultsDescription="Try a different spelling, synonym, or CAS number for Daejung."
    />
  );
}
