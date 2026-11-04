/** One-row heading shared by the Trial Balance, General Ledger and T-Chart pages. */
export function ReportPageHeader({ title, description }: { title: string; description: string }) {
  return (
    <header className="report-header">
      <div className="report-heading"><h1 className="report-title">{title}</h1><p className="report-entity">{description}</p></div>
    </header>
  );
}
