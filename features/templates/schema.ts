import { z } from "zod";
import { DOCUMENT_CATEGORIES } from "@/lib/documents/category-labels";

export const templateFormSchema = z
  .object({
    name: z.string().trim().min(1, "Name is required").max(200),
    content: z.string().trim().min(1, "Content is required").max(20000),
    category: z.enum(DOCUMENT_CATEGORIES),
    customCategoryLabel: z.string().trim().max(100).optional().or(z.literal("")),
  })
  .refine((data) => data.category !== "custom" || !!data.customCategoryLabel?.trim(), {
    message: "Enter a label for the custom category",
    path: ["customCategoryLabel"],
  });

export type TemplateFormValues = z.infer<typeof templateFormSchema>;

const PLACEHOLDER_PATTERN = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

export const extractPlaceholders = (content: string): string[] => {
  const found = new Set<string>();
  for (const match of content.matchAll(PLACEHOLDER_PATTERN)) {
    found.add(match[1]);
  }
  return Array.from(found);
};

export const substitutePlaceholders = (content: string, values: Record<string, string>): string =>
  content.replace(PLACEHOLDER_PATTERN, (_match, name: string) => values[name] ?? "");
