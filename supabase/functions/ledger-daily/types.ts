import type { LedgerPaymentEvent } from "../ledger-payment/ledger.ts";

export type { LedgerReference } from "../_shared/ledger-links.ts";
import type { LedgerReference } from "../_shared/ledger-links.ts";
export interface CategoryDefinition {
  id: string;
  code: string;
  name: string;
  module: string;
  tableId: string;
  eventType: LedgerPaymentEvent["eventType"];
  filter: (query: FormulaBuilder) => string;
  input: "record" | "linked-payment";
  status: "implemented" | "partial" | "blocked" | "deferred";
  related?: {
    tableId: string;
    filter: (query: FormulaBuilder) => string;
    linksFieldId: string;
    through?: { tableId: string; linksFieldId: string };
  };
}
export interface FormulaBuilder {
  field(tableId: string, fieldId: string): string;
  eq(tableId: string, fieldId: string, value: string | number): string;
  includes(tableId: string, fieldId: string, value: string): string;
}
export type RunState = {
  dryRun: boolean;
  categoryIds: string[];
  categoryIndex: number;
  phase: "related" | "discover" | "process";
  offset: string | null;
  relatedIds: string[];
  relatedIndex: number;
  recordIds: string[];
  recordIndex: number;
  stats: { candidates: number; processed: number; matched: number; posted: number; existing: number; zero: number; errors: number };
  errors: { category: string; recordId: string; message: string }[];
  done: boolean;
}
export interface RunJob { id: string; state: RunState; leaseToken: string }
export interface RunStore {
  claim(runKey: string, initial: RunState): Promise<RunJob | null>;
  save(job: RunJob): Promise<void>;
  release(job: RunJob): Promise<void>;
}
export interface LedgerStore {
  prepareSources(tableId: string, recordIds: string[]): Promise<void>;
  findCategory(tableId: string, recordId: string, rule: string): Promise<LedgerReference[]>;
  syncLinks(tableId: string, recordId: string): Promise<LedgerReference[]>;
  hasReversals(tableId: string, recordId: string): Promise<boolean>;
  // Resolves only after posting and source writeback are confirmed.
  post(event: LedgerPaymentEvent): Promise<{ postedCount: number; duplicateCount: number; status?: string; requestId?: string }>;
}
