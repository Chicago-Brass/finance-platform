import { ReportLink } from "./ReportNavigation";
import { reportHref } from "@/lib/reports/filter-options";

export function ReportViewControls({ params, grains }: {
  params: Record<string, string>;
  grains: { value: string; label: string }[];
}) {
  return (
    <div className="report-segments">
      <div className="view-control-group">
        <span className="segment-label">View</span>
        <div className="segmented-control" aria-label="Report columns">
          {grains.map(grain => (
            <ReportLink key={grain.value} href={reportHref(params, { grain: grain.value })} className={`segment-option${params.grain === grain.value ? " is-active" : ""}`} aria-current={params.grain === grain.value ? "true" : undefined}>{grain.label}</ReportLink>
          ))}
        </div>
      </div>
      <div className="view-control-group">
        <span className="segment-label">Display</span>
        <div className="segmented-control" aria-label="Report detail">
          {[{ value: "summary", label: "Summary" }, { value: "detail", label: "Details" }].map(layout => (
            <ReportLink key={layout.value} href={reportHref(params, { layout: layout.value })} className={`segment-option${params.layout === layout.value ? " is-active" : ""}`} aria-current={params.layout === layout.value ? "true" : undefined}>{layout.label}</ReportLink>
          ))}
        </div>
      </div>
    </div>
  );
}

export function CalendarMark() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true"><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 11h18" /></svg>;
}
