const whole = new Intl.NumberFormat("en-US", { maximumFractionDigits: 0, minimumFractionDigits: 0 });
const reportMoney = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", currencySign: "accounting", minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Report displays retain cents and distinguish a missing value from a zero balance. */
export function formatReportAmount(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "-";
  const rounded = Math.round(value * 100) / 100;
  return reportMoney.format(rounded === 0 ? 0 : rounded);
}

/** Accounting format: whole dollars, negatives in parentheses, zero as a dash. */
export function formatAmount(v: number | null | undefined, withSymbol = false): string {
  if (v == null) return "";
  const r = Math.round(v);
  if (r === 0) return "–";
  const body = whole.format(Math.abs(r));
  const s = withSymbol ? `$${body}` : body;
  return r < 0 ? `(${s})` : s;
}

export function formatPercent(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return "n/m";
  const p = v * 100;
  if (Math.abs(p) < 0.05) return "0.0%";
  return p < 0 ? `(${Math.abs(p).toFixed(1)}%)` : `${p.toFixed(1)}%`;
}
