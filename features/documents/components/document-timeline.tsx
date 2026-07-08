import { ACTION_LABELS } from "@/lib/audit/action-labels";

type TimelineEntry = {
  id: string;
  action: string;
  actorEmail: string | null;
  createdAt: Date;
};

type DocumentTimelineProps = {
  entries: TimelineEntry[];
};

/** Vertical timeline of every lifecycle event recorded for a document, oldest first. */
export const DocumentTimeline = ({ entries }: DocumentTimelineProps) => {
  if (entries.length === 0) {
    return <p className="text-sm text-muted-foreground">No activity recorded yet.</p>;
  }

  const chronological = [...entries].reverse();

  return (
    <ol className="space-y-4 border-l pl-4">
      {chronological.map((entry) => (
        <li key={entry.id} className="relative">
          <span className="absolute top-1.5 -left-[21px] size-2.5 rounded-full bg-primary" />
          <p className="text-sm font-medium">{ACTION_LABELS[entry.action] ?? entry.action}</p>
          <p className="text-xs text-muted-foreground">
            {entry.createdAt.toLocaleString()} · {entry.actorEmail ?? "system"}
          </p>
        </li>
      ))}
    </ol>
  );
};
