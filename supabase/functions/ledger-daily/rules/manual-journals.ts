import { MANUAL_TABLE, MANUAL_FIELDS as F } from "../definitions.ts";
import type { CategoryDefinition } from "../types.ts";
import { and } from "./common.ts";

export const MANUAL_CATEGORIES: CategoryDefinition[] = [{
  id: "MAN-01", code: "MAN-01", name: "Manual Journal Entry", module: "manual", tableId: MANUAL_TABLE,
  eventType: "entry_requested", input: "record", status: "implemented",
  filter: q => and(`LEN(${q.field(MANUAL_TABLE, F.date)}&"")>0`, q.eq(MANUAL_TABLE, F.posted, 0), q.eq(MANUAL_TABLE, F.cancelled, 0)),
}];
