"use client";

import type { LedgerAccountFilters } from "@/lib/reports/ledger";
import { DismissibleMenu } from "./DismissibleMenu";
import { FilterField } from "./FilterControls";
import { ledgerAmountParam } from "./ledger-table-utils";
import { SearchableSelect } from "./SearchableSelect";
import type { SelectOption } from "./SearchableSelect";

export function LedgerFilters({ min, max, category, categories, onChange }: Pick<LedgerAccountFilters, "min" | "max" | "category"> & { categories: SelectOption[]; onChange: (filters: Pick<LedgerAccountFilters, "min" | "max" | "category">) => void }) {
  const count = Number(!!category) + Number(min !== undefined) + Number(max !== undefined);
  return <DismissibleMenu className="report-filter-menu ledger-more-filters">
    <summary className="btn btn-quiet">Filters{count > 0 && <span className="report-filter-count">{count}</span>}</summary>
    <div className="report-filter-popover">
      <h2>Additional filters</h2>
      <SearchableSelect className="ledger-category-select" label="Transaction category" value={category ?? ""} options={categories} onChange={value => onChange({ category: value || undefined })} />
      <form key={`${min}:${max}`} className="ledger-amount-fields" aria-label="Ledger amount range" onSubmit={event => {
        event.preventDefault();
        const form = event.currentTarget, fields = new FormData(form);
        const minimum = fields.get("min") === "" ? undefined : ledgerAmountParam(String(Number(fields.get("min"))));
        const maximum = fields.get("max") === "" ? undefined : ledgerAmountParam(String(Number(fields.get("max"))));
        const maximumInput = form.elements.namedItem("max") as HTMLInputElement;
        if (minimum !== undefined && maximum !== undefined && maximum < minimum) {
          maximumInput.setCustomValidity("Maximum must be greater than or equal to minimum.");
          maximumInput.reportValidity();
          return;
        }
        onChange({ min: minimum, max: maximum });
        const menu = form.closest("details");
        if (menu) { menu.open = false; menu.querySelector("summary")?.focus(); }
      }} onInput={event => { (event.currentTarget.elements.namedItem("max") as HTMLInputElement).setCustomValidity(""); }}>
        <FilterField label="Minimum ($)" htmlFor="ledger-min"><input id="ledger-min" name="min" type="number" min="0" max={Number.MAX_SAFE_INTEGER / 100} step="0.01" defaultValue={min ?? ""} placeholder="No minimum" /></FilterField>
        <FilterField label="Maximum ($)" htmlFor="ledger-max"><input id="ledger-max" name="max" type="number" min="0" max={Number.MAX_SAFE_INTEGER / 100} step="0.01" defaultValue={max ?? ""} placeholder="No maximum" /></FilterField>
        <button className="btn btn-primary" type="submit">Apply filters</button>
      </form>
      <p>Matches each journal line's debit or credit amount, including both limits.</p>
    </div>
  </DismissibleMenu>;
}
