import { z } from "zod";

export const MAX_UPLOAD_SIZE_BYTES = 2 * 1024 * 1024;

export const uploadDocumentForSignatureSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(200),
});

export type UploadDocumentForSignatureFormValues = z.infer<typeof uploadDocumentForSignatureSchema>;
