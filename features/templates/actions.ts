"use server";

import { revalidatePath } from "next/cache";
import { and, asc, count, eq, ilike, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { templates } from "@/drizzle/schema";
import { getCurrentProfile } from "@/lib/auth/get-current-profile";
import { logAuditEvent } from "@/lib/audit/log";
import type { DocumentCategory } from "@/lib/documents/category-labels";
import { extractPlaceholders, templateFormSchema } from "./schema";

const PAGE_SIZE = 10;

export type TemplateActionResult = { success: true } | { success: false; error: string };

export const listTemplates = async (search: string, page: number, category?: DocumentCategory) => {
  const profile = await getCurrentProfile();

  const whereClause = and(
    eq(templates.employerId, profile.id),
    isNull(templates.deletedAt),
    category ? eq(templates.category, category) : undefined,
    search ? ilike(templates.name, `%${search}%`) : undefined,
  );

  const [rows, [{ total }]] = await Promise.all([
    db
      .select()
      .from(templates)
      .where(whereClause)
      .orderBy(asc(templates.name))
      .limit(PAGE_SIZE)
      .offset((page - 1) * PAGE_SIZE),
    db.select({ total: count() }).from(templates).where(whereClause),
  ]);

  return { templates: rows, total, pageSize: PAGE_SIZE };
};

/** Full unpaginated list for pickers (e.g. "generate from template") — employers have few templates. */
export const listTemplatesForPicker = async () => {
  const profile = await getCurrentProfile();

  const rows = await db
    .select({
      id: templates.id,
      name: templates.name,
      placeholders: templates.placeholders,
      category: templates.category,
      customCategoryLabel: templates.customCategoryLabel,
    })
    .from(templates)
    .where(and(eq(templates.employerId, profile.id), isNull(templates.deletedAt)))
    .orderBy(asc(templates.name));

  return rows.map((row) => ({
    ...row,
    placeholders: Array.isArray(row.placeholders) ? (row.placeholders as string[]) : [],
  }));
};

export const getTemplateById = async (id: string) => {
  const profile = await getCurrentProfile();

  const [template] = await db
    .select()
    .from(templates)
    .where(
      and(eq(templates.id, id), eq(templates.employerId, profile.id), isNull(templates.deletedAt)),
    )
    .limit(1);

  return template ?? null;
};

export const createTemplate = async (values: unknown): Promise<TemplateActionResult> => {
  const profile = await getCurrentProfile();
  const parsed = templateFormSchema.safeParse(values);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const [created] = await db
    .insert(templates)
    .values({
      employerId: profile.id,
      name: parsed.data.name,
      content: parsed.data.content,
      placeholders: extractPlaceholders(parsed.data.content),
      category: parsed.data.category,
      customCategoryLabel: parsed.data.category === "custom" ? parsed.data.customCategoryLabel || null : null,
    })
    .returning({ id: templates.id });

  await logAuditEvent({
    action: "template.created",
    actorEmail: profile.email,
    metadata: { templateId: created.id, name: parsed.data.name },
  });

  revalidatePath("/dashboard/templates");
  return { success: true };
};

export const updateTemplate = async (
  id: string,
  values: unknown,
): Promise<TemplateActionResult> => {
  const profile = await getCurrentProfile();
  const parsed = templateFormSchema.safeParse(values);

  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  await db
    .update(templates)
    .set({
      name: parsed.data.name,
      content: parsed.data.content,
      placeholders: extractPlaceholders(parsed.data.content),
      category: parsed.data.category,
      customCategoryLabel: parsed.data.category === "custom" ? parsed.data.customCategoryLabel || null : null,
      updatedAt: new Date(),
    })
    .where(and(eq(templates.id, id), eq(templates.employerId, profile.id)));

  await logAuditEvent({ action: "template.updated", actorEmail: profile.email, metadata: { templateId: id } });

  revalidatePath("/dashboard/templates");
  return { success: true };
};

export const deleteTemplate = async (id: string) => {
  const profile = await getCurrentProfile();

  await db
    .update(templates)
    .set({ deletedAt: new Date() })
    .where(and(eq(templates.id, id), eq(templates.employerId, profile.id)));

  await logAuditEvent({ action: "template.deleted", actorEmail: profile.email, metadata: { templateId: id } });

  revalidatePath("/dashboard/templates");
};
