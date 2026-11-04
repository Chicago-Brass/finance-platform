import { todayChicago } from "../dates";

export function reportHref(params: Record<string, string>, changes: Record<string, string>) {
  return `?${new URLSearchParams({ ...params, ...changes })}`;
}

export function incomeDatePresets(today = todayChicago()) {
  const year = Number(today.slice(0, 4)), month = Number(today.slice(5, 7));
  const quarterStart = Math.floor((month - 1) / 3) * 3 + 1;
  return [
    { label: "Year to date", year, from: 1, to: month },
    { label: "This quarter", year, from: quarterStart, to: quarterStart + 2 },
    { label: "Last quarter", year: quarterStart === 1 ? year - 1 : year, from: quarterStart === 1 ? 10 : quarterStart - 3, to: quarterStart === 1 ? 12 : quarterStart - 1 },
  ];
}

export function balanceDatePresets(today = todayChicago()) {
  const year = Number(today.slice(0, 4)), month = Number(today.slice(5, 7));
  const quarterStart = Math.floor((month - 1) / 3) * 3 + 1;
  return [
    { label: "Today", asOf: today },
    { label: "Last month-end", asOf: new Date(Date.UTC(year, month - 1, 0)).toISOString().slice(0, 10) },
    { label: "Last quarter-end", asOf: new Date(Date.UTC(year, quarterStart - 1, 0)).toISOString().slice(0, 10) },
  ];
}
