import { ledgerRead } from "@/lib/reports/report-session";
import type { progressQuery } from "./query";
import { PROGRESS_PAGE_SIZE } from "./query";
import type { ProgressData, ProgressDetail } from "./types";

type Query = ReturnType<typeof progressQuery>;
export function getProgress(query: Query): Promise<ProgressData | ProgressDetail | null> {
  return ledgerRead(async client => {
    const [result, role] = await Promise.all([
      query.rule
        ? client.rpc("get_ledger_rule_journals", { p_rule: query.rule, p_from: query.from, p_to: query.to, p_page: query.page })
        : client.rpc("get_ledger_rule_progress", { p_from: query.from, p_to: query.to, p_query: query.query, p_category: query.category,
          p_implementation: query.implementation, p_enabled: query.enabled, p_page: query.page, p_size: PROGRESS_PAGE_SIZE }),
      client.rpc("current_app_role"),
    ]);
    if (result.error || role.error) throw new Error("Rule progress query failed.");
    return result.data ? { ...result.data, canManage: role.data === "admin" } as ProgressData | ProgressDetail : null;
  });
}

export class ProgressMutationError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

export function setProgressEnabled(ruleCode: string, enabled: boolean): Promise<{ ruleCode: string; enabled: boolean }> {
  return ledgerRead(async client => {
    const role = await client.rpc("current_app_role");
    if (role.error) throw new Error("Rule permission query failed.");
    if (role.data !== "admin") throw new ProgressMutationError(403, "Only administrators can enable or disable rules.");
    const { data, error } = await client.from("ledger_rules").update({ enabled }).eq("rule_code", ruleCode).is("retired_at", null).select("rule_code,enabled").maybeSingle();
    if (error) {
      if (error.code === "42501") throw new ProgressMutationError(403, "You cannot change this rule.");
      throw new Error("Rule update failed.");
    }
    if (!data) throw new ProgressMutationError(404, "Rule is not available.");
    return { ruleCode: data.rule_code, enabled: data.enabled };
  });
}
