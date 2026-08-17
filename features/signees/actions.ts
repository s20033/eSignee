"use server";

import { revalidatePath } from "next/cache";
import { and, asc, count, eq, ilike, isNull, or } from "drizzle-orm";
import { db } from "@/lib/db";
import { signees } from "@/drizzle/schema";
import { requireTenantAdmin } from "@/lib/auth/get-current-profile";
import { logAuditEvent } from "@/lib/audit/log";
import { signeeFormSchema, toSigneeInsertValues } from "./schema";

const PAGE_SIZE = 10;

export type SigneeActionResult = { success: true } | { success: false; error: string };

export const listSignees = async (search: string, page: number) => {
  const profile = await requireTenantAdmin();

  const whereClause = and(
    eq(signees.tenantId, profile.tenantId),
    isNull(signees.deletedAt),
    search
      ? or(ilike(signees.fullName, `%${search}%`), ilike(signees.email, `%${search}%`), ilike(signees.companyName, `%${search}%`))
      : undefined,
  );

  const [rows, [{ total }]] = await Promise.all([
    db
      .select()
      .from(signees)
      .where(whereClause)
      .orderBy(asc(signees.fullName))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ total: count() }).from(signees).where(whereClause),
  ]);

  return { signees: rows, total, pageSize: PAGE_SIZE };
};

/** Every non-deleted signee, unpaginated — for the "who is this document for" picker when generating a document. */
export const listAllSignees = async () => {
  const profile = await requireTenantAdmin();

  return db
    .select()
    .from(signees)
    .where(and(eq(signees.tenantId, profile.tenantId), isNull(signees.deletedAt)))
    .orderBy(asc(signees.fullName));
};

export const getSigneeById = async (id: string) => {
  const profile = await requireTenantAdmin();

  const [signee] = await db
    .select()
    .from(signees)
    .where(and(eq(signees.id, id), eq(signees.tenantId, profile.tenantId), isNull(signees.deletedAt)))
    .limit(1);

  return signee ?? null;
};

export const createSignee = async (values: unknown): Promise<SigneeActionResult> => {
  const profile = await requireTenantAdmin();
  const parsed = signeeFormSchema.safeParse(values);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const [created] = await db
    .insert(signees)
    .values(toSigneeInsertValues(parsed.data, profile.id, profile.tenantId))
    .returning({ id: signees.id });

  await logAuditEvent({
    action: "signee.created",
    actorEmail: profile.email,
    tenantId: profile.tenantId,
    metadata: { signeeId: created.id, fullName: parsed.data.fullName },
  });

  revalidatePath("/dashboard/signees");
  return { success: true };
};

export const updateSignee = async (id: string, values: unknown): Promise<SigneeActionResult> => {
  const profile = await requireTenantAdmin();
  const parsed = signeeFormSchema.safeParse(values);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await db
    .update(signees)
    .set({ ...toSigneeInsertValues(parsed.data, profile.id, profile.tenantId), updatedAt: new Date() })
    .where(and(eq(signees.id, id), eq(signees.tenantId, profile.tenantId)));

  await logAuditEvent({
    action: "signee.updated",
    actorEmail: profile.email,
    tenantId: profile.tenantId,
    metadata: { signeeId: id },
  });

  revalidatePath("/dashboard/signees");
  return { success: true };
};

export const deleteSignee = async (id: string) => {
  const profile = await requireTenantAdmin();

  await db
    .update(signees)
    .set({ deletedAt: new Date() })
    .where(and(eq(signees.id, id), eq(signees.tenantId, profile.tenantId)));

  await logAuditEvent({
    action: "signee.deleted",
    actorEmail: profile.email,
    tenantId: profile.tenantId,
    metadata: { signeeId: id },
  });

  revalidatePath("/dashboard/signees");
};
