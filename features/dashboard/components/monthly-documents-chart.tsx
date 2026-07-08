type MonthlyCount = {
  month: string; // "YYYY-MM"
  count: number;
};

type MonthlyDocumentsChartProps = {
  data: MonthlyCount[];
};

const WIDTH = 480;
const HEIGHT = 180;
const PADDING_LEFT = 28;
const PADDING_BOTTOM = 20;
const PADDING_TOP = 12;
// Single series (the chart's own title already names it, so no legend needed) —
// matches the app's own ink/border tokens rather than an unrelated accent hue.
const BAR_COLOR = "var(--foreground)";
const GRID_COLOR = "var(--border)";

const monthLabel = (isoMonth: string) => {
  const [year, month] = isoMonth.split("-").map(Number);
  return new Date(year, month - 1, 1).toLocaleDateString(undefined, { month: "short" });
};

const niceMax = (max: number) => {
  if (max <= 4) return 4;
  const step = Math.pow(10, Math.floor(Math.log10(max)));
  const rounded = Math.ceil(max / step) * step;
  // Keep it evenly divisible by 2 so the midpoint tick is a whole number.
  return rounded % 2 === 0 ? rounded : rounded + step;
};

export const MonthlyDocumentsChart = ({ data }: MonthlyDocumentsChartProps) => {
  if (data.every((point) => point.count === 0)) {
    return <p className="text-sm text-muted-foreground">No documents generated in this period yet.</p>;
  }

  const plotWidth = WIDTH - PADDING_LEFT;
  const plotHeight = HEIGHT - PADDING_TOP - PADDING_BOTTOM;
  const max = niceMax(Math.max(...data.map((d) => d.count)));
  const slotWidth = plotWidth / data.length;
  const barWidth = Math.min(24, slotWidth * 0.55);

  const yTicks = [0, max / 2, max];

  return (
    <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width="100%" height={HEIGHT} role="img" aria-label="Documents generated per month">
      {yTicks.map((tick) => {
        const y = PADDING_TOP + plotHeight - (tick / max) * plotHeight;
        return (
          <g key={tick}>
            <line x1={PADDING_LEFT} y1={y} x2={WIDTH} y2={y} stroke={GRID_COLOR} strokeWidth={1} />
            <text x={PADDING_LEFT - 6} y={y} textAnchor="end" dominantBaseline="middle" className="fill-muted-foreground" fontSize={9}>
              {Math.round(tick)}
            </text>
          </g>
        );
      })}

      {data.map((point, index) => {
        const barHeight = max === 0 ? 0 : (point.count / max) * plotHeight;
        const x = PADDING_LEFT + index * slotWidth + (slotWidth - barWidth) / 2;
        const y = PADDING_TOP + plotHeight - barHeight;
        const isLast = index === data.length - 1;

        return (
          <g key={point.month}>
            <rect x={x} y={y} width={barWidth} height={Math.max(barHeight, 1)} rx={4} fill={BAR_COLOR}>
              <title>{`${monthLabel(point.month)}: ${point.count} document${point.count === 1 ? "" : "s"}`}</title>
            </rect>
            {isLast && barHeight > 14 && (
              <text
                x={x + barWidth / 2}
                y={y - 4}
                textAnchor="middle"
                className="fill-foreground"
                fontSize={10}
                fontWeight={600}
              >
                {point.count}
              </text>
            )}
            <text
              x={x + barWidth / 2}
              y={HEIGHT - 4}
              textAnchor="middle"
              className="fill-muted-foreground"
              fontSize={9}
            >
              {monthLabel(point.month)}
            </text>
          </g>
        );
      })}
    </svg>
  );
};
