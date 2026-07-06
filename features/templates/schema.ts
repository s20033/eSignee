import { z } from "zod";

export const templateFormSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(200),
  content: z.string().trim().min(1, "Content is required").max(20000),
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
