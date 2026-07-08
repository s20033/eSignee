import {
  DOCUMENT_STATUS_COLORS,
  DOCUMENT_STATUS_ICONS,
  DOCUMENT_STATUS_LABELS,
  DOCUMENT_STATUS_ORDER,
} from "@/lib/documents/status-labels";
import type { Document } from "@/types/document";

type DocumentStatusPieChartProps = {
  counts: Record<Document["status"], number>;
};

const SIZE = 160;
const CENTER = SIZE / 2;
const RADIUS = 62;
const RING_WIDTH = 26;
const GAP_PX = 3;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

export const DocumentStatusPieChart = ({ counts }: DocumentStatusPieChartProps) => {
  const total = Object.values(counts).reduce((sum, n) => sum + n, 0);
  const segments = DOCUMENT_STATUS_ORDER.map((status) => ({ status, count: counts[status] ?? 0 })).filter(
    (segment) => segment.count > 0,
  );

  if (total === 0) {
    return <p className="text-sm text-muted-foreground">No documents generated yet.</p>;
  }

  let cumulative = 0;

  return (
    <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-center sm:justify-center">
      <div className="relative shrink-0" style={{ width: SIZE, height: SIZE }}>
        <svg viewBox={`0 0 ${SIZE} ${SIZE}`} width={SIZE} height={SIZE} role="img" aria-label="Documents by status">
          {segments.map(({ status, count }) => {
            const fraction = count / total;
            const arcLength = fraction * CIRCUMFERENCE;
            const dash = Math.max(arcLength - GAP_PX, 0);
            const offset = -cumulative;
            cumulative += arcLength;

            return (
              <circle
                key={status}
                cx={CENTER}
                cy={CENTER}
                r={RADIUS}
                fill="none"
                stroke={DOCUMENT_STATUS_COLORS[status]}
                strokeWidth={RING_WIDTH}
                strokeDasharray={`${dash} ${CIRCUMFERENCE - dash}`}
                strokeDashoffset={offset}
                transform={`rotate(-90 ${CENTER} ${CENTER})`}
              >
                <title>{`${DOCUMENT_STATUS_LABELS[status]}: ${count} (${Math.round((count / total) * 100)}%)`}</title>
              </circle>
            );
          })}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-semibold tabular-nums">{total}</span>
          <span className="text-xs text-muted-foreground">documents</span>
        </div>
      </div>

      <ul className="w-full min-w-0 space-y-1.5 text-sm sm:max-w-56">
        {segments.map(({ status, count }) => {
          const Icon = DOCUMENT_STATUS_ICONS[status];
          return (
            <li key={status} className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-2">
                <Icon className="size-3.5 shrink-0" style={{ color: DOCUMENT_STATUS_COLORS[status] }} />
                <span className="truncate">{DOCUMENT_STATUS_LABELS[status]}</span>
              </span>
              <span className="shrink-0 tabular-nums text-muted-foreground">{count}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};
