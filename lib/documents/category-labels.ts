/** The fixed category enum, as a tuple — shared with Zod schemas via z.enum(DOCUMENT_CATEGORIES). */
export const DOCUMENT_CATEGORIES = ["hr", "legal", "finance", "operations", "sales", "custom"] as const;

/** Documents and templates both carry this same category enum. */
export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

export const DOCUMENT_CATEGORY_LABELS: Record<DocumentCategory, string> = {
  hr: "HR",
  legal: "Legal",
  finance: "Finance",
  operations: "Operations",
  sales: "Sales",
  custom: "Custom",
};

/** Resolves the display label, substituting the free-text label for the "custom" category. Works for documents and templates alike — both share this category/customCategoryLabel shape. */
export const documentCategoryLabel = (item: {
  category: DocumentCategory;
  customCategoryLabel: string | null;
}): string => (item.category === "custom" ? item.customCategoryLabel || "Custom" : DOCUMENT_CATEGORY_LABELS[item.category]);
