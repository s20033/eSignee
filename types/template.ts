import type { templates } from "@/drizzle/schema";

export type Template = typeof templates.$inferSelect;
export type NewTemplate = typeof templates.$inferInsert;
