const ISO = /^\d{4}-\d{2}-\d{2}$/;

/** Today in Chicago, as YYYY-MM-DD. */
export function todayChicago() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Chicago" }).format(new Date());
}

export function cleanDate(v: string | string[] | undefined, fallback: string) {
  const s = Array.isArray(v) ? v[0] : v;
  return s && ISO.test(s) && !Number.isNaN(Date.parse(s)) ? s : fallback;
}

export function startOfYear(iso: string) {
  return `${iso.slice(0, 4)}-01-01`;
}
