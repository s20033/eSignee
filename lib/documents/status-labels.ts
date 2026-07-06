import type { Document } from "@/types/document";

export const DOCUMENT_STATUS_LABELS: Record<Document["status"], string> = {
  draft: "Draft",
  waiting: "Awaiting employee signature",
  employee_signed: "Awaiting employer signature",
  completed: "Completed",
  archived: "Archived",
};
