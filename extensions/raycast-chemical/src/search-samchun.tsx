import { ChemicalSearchCommand } from "./components/chemical-search-command";
import { searchChemicalProviders } from "./core/search-providers";

const SAMCHUN_VENDOR = ["Samchun"] as const;
const searchSamchunOnly = (rawQuery: string) =>
  searchChemicalProviders(rawQuery, SAMCHUN_VENDOR);

export default function SearchSamchunCommand() {
  return (
    <ChemicalSearchCommand
      vendors={SAMCHUN_VENDOR}
      search={searchSamchunOnly}
      emptyTitle="Search Samchun catalog"
      emptyDescription="Enter an English chemical name or CAS number to query Samchun only."
      noResultsDescription="Try a different spelling, synonym, or CAS number for Samchun."
    />
  );
}
