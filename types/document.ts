import type { documents } from "@/drizzle/schema";

export type Document = typeof documents.$inferSelect;
export type NewDocument = typeof documents.$inferInsert;
