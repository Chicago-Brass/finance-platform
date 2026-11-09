const dollars = new Intl.NumberFormat("en-US", { maximumFractionDigits: 2, minimumFractionDigits: 2 });

/** Accounting format retains cents, parentheses for negatives and an explicit zero. */
export function formatAmount(v: number | null | undefined, withSymbol = false): string {
  if (v == null || !Number.isFinite(v)) return "";
  const r = Math.round(v * 100) / 100;
  if (r === 0) return "$0.00";
  const body = dollars.format(Math.abs(r));
  const s = withSymbol ? `$${body}` : body;
  return r < 0 ? `(${s})` : s;
}

export function formatPercent(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return "n/m";
  const p = v * 100;
  if (Math.abs(p) < 0.05) return "0.0%";
  return p < 0 ? `(${Math.abs(p).toFixed(1)}%)` : `${p.toFixed(1)}%`;
}
