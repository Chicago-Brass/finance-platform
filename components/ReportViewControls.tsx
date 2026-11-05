import { SegmentedControl } from "./FilterControls";

/** View (columns) and Display (summary/detail) switches reuse the current data window. */
export function ReportViewControls<G extends string>({ grains, grain, summary, onGrain, onSummary }: {
  grains: { value: G; label: string }[];
  grain: G;
  summary: boolean;
  onGrain: (grain: G) => void;
  onSummary: (summary: boolean) => void;
}) {
  return (
    <>
      <SegmentedControl label="View" value={grain} options={grains} onChange={onGrain} />
      <SegmentedControl label="Display" value={summary} options={[{ value: true, label: "Summary" }, { value: false, label: "Details" }]} onChange={onSummary} />
    </>
  );
}

export function CalendarMark() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" /></svg>;
}
