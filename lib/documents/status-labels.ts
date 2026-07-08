import { ClockIcon, CheckCircle2Icon, CircleDashedIcon, ArchiveIcon, type LucideIcon } from "lucide-react";
import type { Document } from "@/types/document";

export const DOCUMENT_STATUS_LABELS: Record<Document["status"], string> = {
  draft: "Draft",
  waiting: "Awaiting employee signature",
  employee_signed: "Awaiting employer signature",
  completed: "Completed",
  archived: "Archived",
};

export const DOCUMENT_STATUS_ORDER: Document["status"][] = [
  "draft",
  "waiting",
  "employee_signed",
  "completed",
  "archived",
];

/**
 * Color here is a *status* job (state, not series identity): draft/archived are
 * neutral — nobody owes an action — waiting/employee_signed share the one warning
 * hue since both mean "blocked on a signature" (the label says whose turn it is),
 * and completed is the one good state. Fixed, reserved tokens from app/globals.css
 * (--status-good/--status-warning), not a categorical palette.
 */
export const DOCUMENT_STATUS_COLORS: Record<Document["status"], string> = {
  draft: "var(--muted-foreground)",
  waiting: "var(--status-warning)",
  employee_signed: "var(--status-warning)",
  completed: "var(--status-good)",
  archived: "var(--border)",
};

export const DOCUMENT_STATUS_ICONS: Record<Document["status"], LucideIcon> = {
  draft: CircleDashedIcon,
  waiting: ClockIcon,
  employee_signed: ClockIcon,
  completed: CheckCircle2Icon,
  archived: ArchiveIcon,
};
