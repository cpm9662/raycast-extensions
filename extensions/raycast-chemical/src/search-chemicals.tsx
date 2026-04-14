import { ChemicalSearchCommand } from "./components/chemical-search-command";
import { ALL_VENDORS, searchChemicalProviders } from "./core/search-providers";

const searchAllProviders = (rawQuery: string) =>
  searchChemicalProviders(rawQuery, ALL_VENDORS);

export default function SearchChemicalsCommand() {
  return (
    <ChemicalSearchCommand
      vendors={ALL_VENDORS}
      search={searchAllProviders}
      emptyTitle="Search Korean chemical catalogs"
      emptyDescription="Enter an English chemical name or CAS number to query Daejung, Samchun, and Sigma-Aldrich."
    />
  );
}
