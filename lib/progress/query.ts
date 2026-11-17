export const PROGRESS_PAGE_SIZE = 50;
export const PROGRESS_JOURNAL_PAGE_SIZE = 25;
export const PROGRESS_ATTEMPTS_LIMIT = 20;
const categories = new Set(["", "expense", "payment", "invoice_entry", "other"]);
const implementations = new Set(["", "fully", "partial", "not_implemented", "deferred"]);

export function progressToggle(value: unknown): { ruleCode: string; enabled: boolean } {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new RangeError("Choose a rule and its enabled state.");
  const input = value as Record<string, unknown>;
  if (Object.keys(input).some(key => key !== "ruleCode" && key !== "enabled")
    || typeof input.ruleCode !== "string" || !/^[A-Z][A-Z0-9_-]{1,49}$/.test(input.ruleCode)
    || typeof input.enabled !== "boolean") throw new RangeError("Choose a rule and its enabled state.");
  return { ruleCode: input.ruleCode, enabled: input.enabled };
}

export function progressQuery(params: URLSearchParams) {
  const date = (key: string) => {
    const value = params.get(key);
    if (!value) return null;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || Number(value.slice(0, 4)) < 1
      || !Number.isFinite(Date.parse(value)) || new Date(value).toISOString().slice(0, 10) !== value) {
      throw new RangeError("Choose valid activity dates.");
    }
    return value;
  };
  const from = date("from"), to = date("to");
  if (from && to && from > to) throw new RangeError("Activity start must be before the end date.");
  const normalize = (value: string | null) => !value || value === "all" ? "" : value;
  const category = normalize(params.get("category")), implementation = normalize(params.get("implementation"));
  if (!categories.has(category) || !implementations.has(implementation)) throw new RangeError("Choose valid rule filters.");
  const enabled = params.get("enabled") || "all";
  if (!["all", "enabled", "disabled"].includes(enabled)) throw new RangeError("Choose a valid enabled filter.");
  const value = params.get("page") || "1", page = Number(value);
  if (!/^\d+$/.test(value) || !Number.isSafeInteger(page) || page < 1 || page > 10000) throw new RangeError("Choose a valid page.");
  const rule = params.get("rule");
  if (rule && !/^[A-Z][A-Z0-9_-]{1,49}$/.test(rule)) throw new RangeError("Choose a valid rule code.");
  return { from, to, category, implementation, enabled, page, rule: rule || null, query: (params.get("q") || "").trim().slice(0, 200) };
}
