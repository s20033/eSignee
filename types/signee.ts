import type { signees } from "@/drizzle/schema";

export type Signee = typeof signees.$inferSelect;
export type NewSignee = typeof signees.$inferInsert;
