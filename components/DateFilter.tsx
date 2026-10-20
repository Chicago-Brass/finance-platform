/** Plain GET form: works without JavaScript and keeps dates in the URL. */
export function DateFilter({ from, to, asOfOnly = false, note }: { from?: string; to: string; asOfOnly?: boolean; note?: string }) {
  return (
    <form className="date-filter" method="get">
      {!asOfOnly && (
        <label>
          Start date
          <input type="date" name="from" defaultValue={from} required />
        </label>
      )}
      <label>
        {asOfOnly ? "As of" : "End date"}
        <input type="date" name="to" defaultValue={to} required />
      </label>
      <button className="btn btn-quiet" type="submit">Apply</button>
      {note && <span className="toolbar-hint">{note}</span>}
    </form>
  );
}
