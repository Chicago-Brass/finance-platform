/** View (columns) and Display (summary/detail) switches. They change state in the browser, not the URL's data. */
export function ReportViewControls<G extends string>({ grains, grain, summary, onGrain, onSummary }: {
  grains: { value: G; label: string }[];
  grain: G;
  summary: boolean;
  onGrain: (grain: G) => void;
  onSummary: (summary: boolean) => void;
}) {
  return (
    <div className="report-segments">
      <div className="view-control-group">
        <span className="segment-label">View</span>
        <div className="segmented-control" role="group" aria-label="Report columns">
          {grains.map(item => (
            <button key={item.value} type="button" onClick={() => onGrain(item.value)} className={`segment-option${grain === item.value ? " is-active" : ""}`} aria-pressed={grain === item.value}>{item.label}</button>
          ))}
        </div>
      </div>
      <div className="view-control-group">
        <span className="segment-label">Display</span>
        <div className="segmented-control" role="group" aria-label="Report detail">
          {[{ value: true, label: "Summary" }, { value: false, label: "Details" }].map(item => (
            <button key={item.label} type="button" onClick={() => onSummary(item.value)} className={`segment-option${summary === item.value ? " is-active" : ""}`} aria-pressed={summary === item.value}>{item.label}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CalendarMark() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" /></svg>;
}
