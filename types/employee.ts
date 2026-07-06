import type { employees } from "@/drizzle/schema";

export type Employee = typeof employees.$inferSelect;
export type NewEmployee = typeof employees.$inferInsert;
