import { z } from "zod";

export const companySettingsSchema = z.object({
  companyName: z.string().trim().min(1, "Company name is required").max(200),
  address: z.string().trim().max(500).optional().or(z.literal("")),
  taxId: z.string().trim().max(50).optional().or(z.literal("")),
  regon: z.string().trim().max(50).optional().or(z.literal("")),
  krs: z.string().trim().max(50).optional().or(z.literal("")),
  logoUrl: z
    .string()
    .trim()
    .optional()
    .or(z.literal(""))
    .refine((value) => !value || z.url().safeParse(value).success, "Enter a valid URL"),
  notifyOnSignatureNeeded: z.boolean(),
});

export type CompanySettingsValues = z.infer<typeof companySettingsSchema>;
