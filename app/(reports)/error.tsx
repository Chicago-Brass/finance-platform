"use client";

export default function ReportError({ reset }: { reset: () => void }) {
  return (
    <section className="report-page report-error-state" role="alert">
      <div>
        <h1 className="report-title">Report unavailable</h1>
        <p>We couldn't load the report data. Try again in a moment.</p>
        <button type="button" className="btn btn-quiet btn-primary" onClick={reset}>Try again</button>
      </div>
    </section>
  );
}
