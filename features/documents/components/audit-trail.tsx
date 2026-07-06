const ACTION_LABELS: Record<string, string> = {
  "document.generated": "Document generated",
  "document.signed_by_employee": "Signed by employee",
  "document.signed_by_employer": "Signed by employer",
  "document.completed": "Completed",
};

type AuditEntry = {
  id: string;
  action: string;
  actorEmail: string | null;
  createdAt: Date;
  documentTitle: string;
};

type AuditTrailProps = {
  entries: AuditEntry[];
};

export const AuditTrail = ({ entries }: AuditTrailProps) => {
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">No activity yet.</p>;
  }

  return (
    <ul className="space-y-2 text-sm">
      {entries.map((entry) => (
        <li key={entry.id} className="flex items-center justify-between border-b pb-2 last:border-0">
          <span>
            <span className="font-medium">{ACTION_LABELS[entry.action] ?? entry.action}</span>{" "}
            <span className="text-muted-foreground">— {entry.documentTitle}</span>
          </span>
          <span className="text-xs text-muted-foreground">
            {entry.actorEmail ?? "unknown"} · {entry.createdAt.toLocaleString()}
          </span>
        </li>
      ))}
    </ul>
  );
};
