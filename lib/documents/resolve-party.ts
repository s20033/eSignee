import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { employees, signees } from "@/drizzle/schema";

export type DocumentParty = { name: string; email: string };

/**
 * Resolves the non-employer party's display name/email for one document — from
 * `employees` when employeeId is set, `signees` otherwise. Exactly one of the two
 * is ever set (documents_party_check).
 */
export const resolveDocumentParty = async (document: {
  employeeId: string | null;
  signeeId: string | null;
}): Promise<DocumentParty | null> => {
  if (document.employeeId) {
    const [row] = await db
      .select({ name: employees.fullName, email: employees.email })
      .from(employees)
      .where(eq(employees.id, document.employeeId))
      .limit(1);
    return row ?? null;
  }
  if (document.signeeId) {
    const [row] = await db
      .select({ name: signees.fullName, email: signees.email })
      .from(signees)
      .where(eq(signees.id, document.signeeId))
      .limit(1);
    return row ?? null;
  }
  return null;
};
