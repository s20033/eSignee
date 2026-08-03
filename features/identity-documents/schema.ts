import { z } from "zod";

export const MAX_IDENTITY_DOCUMENT_SIZE_BYTES = 2 * 1024 * 1024;

export const IDENTITY_DOCUMENT_TYPES = [
  "passport",
  "national_id",
  "work_permit",
  "visa",
  "residence_card",
  "other",
] as const;

export type IdentityDocumentType = (typeof IDENTITY_DOCUMENT_TYPES)[number];

export const IDENTITY_DOCUMENT_TYPE_LABELS: Record<IdentityDocumentType, string> = {
  passport: "Passport",
  national_id: "National ID",
  work_permit: "Work permit",
  visa: "Visa",
  residence_card: "Residence card",
  other: "Other",
};

export const uploadIdentityDocumentSchema = z.object({
  type: z.enum(IDENTITY_DOCUMENT_TYPES),
  documentNumber: z.string().trim().max(100).optional().or(z.literal("")),
  issuingCountry: z.string().trim().max(100).optional().or(z.literal("")),
  issueDate: z.string().trim().optional().or(z.literal("")),
  expiryDate: z.string().trim().optional().or(z.literal("")),
});

export type UploadIdentityDocumentFormValues = z.infer<typeof uploadIdentityDocumentSchema>;

export const rejectIdentityDocumentSchema = z.object({
  reason: z.string().trim().min(1, "A reason is required").max(500),
});

export type RejectIdentityDocumentFormValues = z.infer<typeof rejectIdentityDocumentSchema>;
