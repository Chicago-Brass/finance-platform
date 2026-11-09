import { FIN_BASE } from "./definitions.ts";
import { BudgetExceeded, retry, RetryableError, sleep } from "./retry.ts";
import type { FormulaBuilder } from "./types.ts";

interface Field { id: string; name: string; type: string; options?: { linkedTableId?: string } }
interface Table { id: string; name?: string; primaryFieldId: string; fields: Field[] }
interface RawRecord { id: string; fields: Record<string, any> }
interface CachedRecord { row: RawRecord; selected: Set<string> }

// A small record API keeps category calculations independent of REST response formatting.
export class AirtableRecord {
  readonly tableId: string;
  readonly id: string;
  private client: AirtableClient;
  constructor(tableId: string, id: string, client: AirtableClient) { this.tableId = tableId; this.id = id; this.client = client; }
  get name(): string { return this.text(this.client.table(this.tableId).primaryFieldId) || this.id; }
  value(fieldId: string): any {
    const cached = this.client.cached(this.tableId, this.id);
    if (!cached?.selected.has(fieldId)) throw new Error(`Field ${fieldId} was not selected on ${this.id}.`);
    const field = this.client.getField(this.tableId, fieldId), value = cached.row.fields[fieldId] ?? null;
    if (field.type === "singleSelect" && value !== null) return { name: value };
    if (field.type === "multipleSelects") return (value || []).map((name: string) => ({ name }));
    if (field.type === "multipleRecordLinks") return (value || []).map((id: string) => ({ id, name: this.client.linkName(field.options!.linkedTableId!, id) }));
    return value;
  }
  text(fieldId: string): string {
    const value = this.value(fieldId);
    if (value == null) return "";
    if (Array.isArray(value)) return value.map(v => v?.name ?? v ?? "").join(", ");
    return typeof value === "object" ? value.name : String(value);
  }
}

export class AirtableClient implements FormulaBuilder {
  private tables = new Map<string, Table>();
  private cache = new Map<string, CachedRecord>();
  private lastRequest = 0;
  requests = 0;
  private token: string;
  readonly deadline: number;
  private fetcher: typeof fetch;
  private readOnly: boolean;
  private maxRequests: number;
  constructor(token: string, deadline: number, fetcher: typeof fetch = fetch, options: { readOnly?: boolean; maxRequests?: number } = {}) {
    this.token = token; this.deadline = deadline; this.fetcher = fetcher;
    this.readOnly=options.readOnly??false; this.maxRequests=options.maxRequests??80;
  }
  async initialize(): Promise<void> {
    const schema = await this.request("GET", `meta/bases/${FIN_BASE}/tables`);
    this.tables = new Map(schema.tables.map((table: Table) => [table.id, table]));
  }
  table(id: string): Table { const table = this.tables.get(id); if (!table) throw new Error(`Unknown FIN table ${id}.`); return table; }
  getField(tableId: string, id: string): Field {
    const field = this.table(tableId).fields.find(f => f.id === id);
    if (!field) throw new Error(`Missing FIN field ${id} on ${tableId}.`);
    return field;
  }
  field(tableId: string, id: string): string { return `{${this.getField(tableId, id).name}}`; }
  eq(t: string, f: string, value: string | number): string { return `${this.field(t, f)}=${JSON.stringify(value)}`; }
  includes(t: string, f: string, value: string): string { return `FIND(${JSON.stringify(value)},ARRAYJOIN(${this.field(t, f)}))>0`; }
  cached(t: string, id: string): CachedRecord | undefined { return this.cache.get(`${t}/${id}`); }
  linkName(t: string, id: string): string { return String(this.cached(t, id)?.row.fields[this.table(t).primaryFieldId] ?? id); }
  private remember(t: string, rows: RawRecord[], fields: string[]): AirtableRecord[] {
    return rows.map(row => {
      const key = `${t}/${row.id}`, old = this.cache.get(key);
      this.cache.set(key, { row: { id: row.id, fields: { ...old?.row.fields, ...row.fields } }, selected: new Set([...(old?.selected || []), ...fields]) });
      return new AirtableRecord(t, row.id, this);
    });
  }
  async queryIds(tableId: string, formula: string, offset?: string | null): Promise<{ ids: string[]; offset: string | null }> {
    const primary = this.table(tableId).primaryFieldId;
    const params = new URLSearchParams({ filterByFormula: formula, pageSize: "100", returnFieldsByFieldId: "true" });
    params.append("fields[]", primary); if (offset) params.set("offset", offset);
    const result = await this.request("GET", `${FIN_BASE}/${tableId}`, undefined, params);
    // Discovery retains only IDs; full records are fetched after the candidate snapshot is complete.
    return { ids: result.records.map((r: RawRecord) => r.id), offset: result.offset ?? null };
  }
  async queryRecords(tableId: string, formula: string, fields: string[], offset?: string | null): Promise<{ records: AirtableRecord[]; offset: string | null }> {
    const selected = [...new Set([...fields, this.table(tableId).primaryFieldId])];
    const params = new URLSearchParams({ filterByFormula: formula, pageSize: "100", returnFieldsByFieldId: "true" });
    selected.forEach(field => params.append("fields[]", field));
    if (offset) params.set("offset", offset);
    const result = await this.request("GET", `${FIN_BASE}/${tableId}`, undefined, params);
    return { records: this.remember(tableId, result.records, selected), offset: result.offset ?? null };
  }
  async readRecord(t: string, id: string, fields: readonly string[]): Promise<AirtableRecord | null> {
    return (await this.readRecords(t, [id], fields, false))[0] ?? null;
  }
  async readRecords(t: string, ids: string[], fields: readonly string[], requireAll = true): Promise<AirtableRecord[]> {
    const unique = [...new Set(ids)], selected = [...new Set([...fields, this.table(t).primaryFieldId])];
    const missing = unique.filter(id => selected.some(f => !this.cached(t, id)?.selected.has(f)));
    for (let start = 0; start < missing.length; start += 40) {
      const part = missing.slice(start, start + 40), params = new URLSearchParams({ returnFieldsByFieldId: "true", filterByFormula: `OR(${part.map(id => `RECORD_ID()=${JSON.stringify(id)}`).join(",")})`, pageSize: "100" });
      selected.forEach(f => params.append("fields[]", f));
      const result = await this.request("GET", `${FIN_BASE}/${t}`, undefined, params);
      this.remember(t, result.records, selected);
    }
    const found = unique.filter(id => selected.every(f => this.cached(t, id)?.selected.has(f)));
    if (requireAll && found.length !== unique.length) throw new Error(`Missing linked records in ${t}: ${unique.filter(id => !found.includes(id)).join(", ")}`);
    return found.map(id => new AirtableRecord(t, id, this));
  }
  async loadLinkNames(records: AirtableRecord[], fields: string[]): Promise<void> {
    const grouped = new Map<string, Set<string>>();
    for (const record of records) for (const fieldId of fields) {
      const field = this.getField(record.tableId, fieldId), target = field.options?.linkedTableId;
      if (!target) continue;
      if (!grouped.has(target)) grouped.set(target, new Set());
      for (const id of this.cached(record.tableId, record.id)?.row.fields[fieldId] || []) grouped.get(target)!.add(id);
    }
    for (const [tableId, ids] of grouped) await this.readRecords(tableId, [...ids], [this.table(tableId).primaryFieldId]);
  }
  async update(tableId: string, records: { id: string; fields: Record<string, unknown> }[]): Promise<void> {
    for (let start = 0; start < records.length; start += 10) {
      const part = records.slice(start, start + 10);
      await this.request("PATCH", `${FIN_BASE}/${tableId}`, { records: part });
      part.forEach(r => this.cache.delete(`${tableId}/${r.id}`));
    }
  }
  clearRecordCache(): void { this.cache.clear(); }
  requireWritebackBudget(): void {
    if (this.requests + 4 > this.maxRequests || Date.now() + 40_000 >= this.deadline) throw new BudgetExceeded("Reserve time and requests for writeback verification before posting.");
  }
  // Shared writeback uses the same request counter, pacing and read-only boundary as discovery.
  async fetch(url: string | URL | Request, options?: RequestInit): Promise<Response> {
    if (this.readOnly && (options?.method ?? "GET") !== "GET") throw new Error("Read-only preview forbids Airtable writes.");
    if (this.requests >= this.maxRequests) throw new BudgetExceeded("Airtable request batch limit reached; resume this run.");
    if (Date.now() + 20_000 >= this.deadline) throw new BudgetExceeded("Not enough time for another Airtable request.");
    await sleep(Math.max(0, 300 - (Date.now() - this.lastRequest))); this.lastRequest = Date.now(); this.requests++;
    return this.fetcher(url, options);
  }
  private async request(method: string, path: string, body?: unknown, params?: URLSearchParams): Promise<any> {
    if(this.readOnly && method!=="GET")throw new Error("Read-only preview forbids Airtable writes.");
    return retry(async () => {
      let response: Response;
      try { response = await this.fetch(`https://api.airtable.com/v0/${path}${params ? `?${params}` : ""}`, { method, headers: { Authorization: `Bearer ${this.token}`, ...(body ? { "Content-Type": "application/json" } : {}) }, body: body ? JSON.stringify(body) : undefined, signal: AbortSignal.timeout(20_000) }); }
      catch (error) { if (error instanceof BudgetExceeded) throw error; throw new RetryableError("Airtable request did not complete."); }
      if (response.status === 429) throw new RetryableError("Airtable rate limit reached.", 30_000);
      if (response.status >= 500) throw new RetryableError(`Airtable server error (${response.status}).`);
      if (!response.ok) throw new Error(`Airtable ${method} failed (${response.status}): ${await response.text()}`);
      return response.json();
    }, { deadline: this.deadline });
  }
}
