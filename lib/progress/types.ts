export type ImplementationStatus = "fully" | "partial" | "not_implemented" | "deferred";
export type ProgressCategory = "expense" | "invoice_entry" | "payment" | "other";
export type ProgressRule = {
  ruleCode: string;
  displayCode: string;
  name: string;
  category: string;
  sourceTable: string | null;
  sourceLabel: string;
  family: string | null;
  implementationStatus: ImplementationStatus;
  enabled: boolean;
  debitLabel: string | null;
  creditLabel: string | null;
  postedCount: number;
  reversalCount: number;
  succeededCount: number;
  failedCount: number;
  pendingCount: number;
  lastActivityAt: string | null;
  notes: string | null;
};
export type ProgressSummary = {
  rules: number;
  enabled: number;
  posted: number;
  succeeded: number;
  failed: number;
};
export type ProgressData = {
  canManage: boolean;
  rules: ProgressRule[];
  total: number;
  page: number;
  pageSize: number;
  summary: ProgressSummary;
  trackingSince: string;
};
export type ProgressJournalLine = {
  lineNumber: number;
  accountCode: string;
  accountName: string;
  debit: string;
  credit: string;
  branch: string | null;
  auditLink: string | null;
};
export type ProgressJournal = {
  id: string;
  entryNumber: number;
  entryDate: string;
  postedAt: string | null;
  description: string;
  sourceTable: string | null;
  sourceRecordId: string | null;
  auditLink: string | null;
  isReversal: boolean;
  lines: ProgressJournalLine[];
};
export type ProgressAttempt = {
  id: string;
  sourceTable: string;
  sourceRecordId: string;
  outcome: "succeeded" | "failed" | "pending";
  occurredAt: string;
  error: string | null;
  auditLink: string;
};
export type ProgressDetail = {
  canManage: boolean;
  rule: ProgressRule;
  journals: ProgressJournal[];
  total: number;
  page: number;
  pageSize: number;
  attempts: ProgressAttempt[];
  attemptsLimit: number;
  trackingSince: string;
};
