export type PeriodRange = { from: string; to: string };
export type PeriodGrouping = "month" | "quarter" | "year";
export type PeriodOverview = {
  period_month: string;
  status: string;
  posted_count: number;
  pending_count: number;
  adjustments_after_close: number;
};
export type PeriodGroup = PeriodRange & {
  key: string;
  label: string;
  months: string[];
  status: string;
  posted: number;
  pending: number;
  adjustments: number;
};

function date(value: string): string {
  if (!/^\d{4}-(0[1-9]|1[0-2])-\d{2}$/.test(value) || !Number.isFinite(Date.parse(value))
    || new Date(value).toISOString().slice(0, 10) !== value || Number(value.slice(0, 4)) < 1900 || Number(value.slice(0, 4)) > 2199)
    throw new RangeError("Choose valid dates between 1900 and 2199.");
  return value;
}

export function monthEnd(month: string): string {
  return new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 0)).toISOString().slice(0, 10);
}

export function periodRange(from: string, to: string): PeriodRange {
  date(from); date(to);
  if (from > to) throw new RangeError("Start date must be on or before end date.");
  const first = from.slice(0, 7) + "-01", last = monthEnd(to);
  if (Number(last.slice(0, 4)) - Number(first.slice(0, 4)) > 49)
    throw new RangeError("Choose a range of no more than 50 years.");
  return { from: first, to: last };
}

export function nextMonth(month: string): string {
  return new Date(Date.UTC(Number(month.slice(0, 4)), Number(month.slice(5, 7)), 1)).toISOString().slice(0, 10);
}

export function periodGroups(range: PeriodRange, grouping: PeriodGrouping, periods: PeriodOverview[] = []): PeriodGroup[] {
  const grouped = new Map<string, PeriodGroup>(), byMonth = new Map(periods.map(period => [period.period_month, period]));
  for (let month = range.from; month <= range.to; month = nextMonth(month)) {
    const year = month.slice(0, 4), quarter = Math.floor((Number(month.slice(5, 7)) - 1) / 3) + 1;
    const key = grouping === "year" ? year : grouping === "quarter" ? `${year}-Q${quarter}` : month;
    const label = grouping === "year" ? year : grouping === "quarter" ? `Q${quarter} ${year}`
      : new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(new Date(month + "T12:00:00Z"));
    let group = grouped.get(key);
    if (!group) { group = { key, label, from: month, to: monthEnd(month), months: [], status: "not_open", posted: 0, pending: 0, adjustments: 0 }; grouped.set(key, group); }
    group.months.push(month); group.to = monthEnd(month);
    const period = byMonth.get(month);
    group.posted += Number(period?.posted_count ?? 0); group.pending += Number(period?.pending_count ?? 0);
    group.adjustments += Number(period?.adjustments_after_close ?? 0);
  }
  for (const group of grouped.values()) {
    const statuses = new Set(group.months.map(month => byMonth.get(month)?.status ?? "not_open"));
    group.status = statuses.size === 1 ? [...statuses][0] : "mixed";
  }
  return [...grouped.values()].reverse();
}

export function periodPresets(today: string): { label: string; range: PeriodRange }[] {
  const year = Number(today.slice(0, 4)), month = Number(today.slice(5, 7));
  const start = (y: number, m: number) => new Date(Date.UTC(y, m - 1, 1)).toISOString().slice(0, 10);
  const quarter = Math.floor((month - 1) / 3) * 3 + 1;
  return [
    { label: "This month", range: periodRange(start(year, month), monthEnd(today)) },
    { label: "This quarter", range: periodRange(start(year, quarter), monthEnd(start(year, quarter + 2))) },
    { label: "This year", range: periodRange(start(year, 1), `${year}-12-31`) },
    { label: "Last month", range: periodRange(start(year, month - 1), monthEnd(start(year, month - 1))) },
    { label: "Last quarter", range: periodRange(start(year, quarter - 3), monthEnd(start(year, quarter - 1))) },
    { label: "Last year", range: periodRange(start(year - 1, 1), `${year - 1}-12-31`) },
  ];
}

export function periodQueryRange(params: URLSearchParams): { selected: PeriodRange; overview: PeriodRange } {
  const month = params.get("month");
  if (month && !/^\d{4}-(0[1-9]|1[0-2])-01$/.test(month)) throw new RangeError("Choose a valid month.");
  const selected = month ? periodRange(month, month) : periodRange(params.get("from") ?? "", params.get("to") ?? "");
  const overview = periodRange(params.get("overviewFrom") ?? (month ? month.slice(0, 4) + "-01-01" : selected.from),
    params.get("overviewTo") ?? (month ? month.slice(0, 4) + "-12-31" : selected.to));
  if (selected.from < overview.from || selected.to > overview.to) throw new RangeError("Choose a period within the selected date range.");
  return { selected, overview };
}
