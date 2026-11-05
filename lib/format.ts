const reportMoney = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", currencySign: "accounting", minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** Report displays retain cents and distinguish a missing value from a zero balance. */
export function formatReportAmount(value: number | null | undefined): string {
  if (value == null || !Number.isFinite(value)) return "-";
  const rounded = Math.round(value * 100) / 100;
  return reportMoney.format(rounded === 0 ? 0 : rounded);
}

export function formatPercent(v: number | null | undefined): string {
  if (v == null || !Number.isFinite(v)) return "n/m";
  const p = v * 100;
  if (Math.abs(p) < 0.05) return "0.0%";
  return p < 0 ? `(${Math.abs(p).toFixed(1)}%)` : `${p.toFixed(1)}%`;
}
