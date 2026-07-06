import Link from "next/link";
import { Badge } from "@/components/ui/badge";

type ExpirationRow = {
  documentId: string;
  title: string;
  expiresAt: string;
  employeeId: string;
  employeeName: string;
};

type ContractExpiryTrackerProps = {
  expirations: ExpirationRow[];
};

const formatDate = (isoDate: string) => {
  const [year, month, day] = isoDate.split("-");
  return `${day}/${month}/${year}`;
};

const getUrgency = (isoDate: string) => {
  const daysRemaining = Math.ceil((new Date(isoDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));

  if (daysRemaining < 0) {
    return { label: "Expired", variant: "destructive" as const };
  }
  if (daysRemaining <= 30) {
    return { label: `${daysRemaining}d left`, variant: "destructive" as const };
  }
  if (daysRemaining <= 90) {
    return { label: `${daysRemaining}d left`, variant: "secondary" as const };
  }
  return { label: `${daysRemaining}d left`, variant: "outline" as const };
};

export const ContractExpiryTracker = ({ expirations }: ContractExpiryTrackerProps) => {
  if (expirations.length === 0) {
    return <p className="text-sm text-muted-foreground">No contracts with an end date yet.</p>;
  }

  return (
    <ul className="space-y-3 text-sm">
      {expirations.map((row) => {
        const urgency = getUrgency(row.expiresAt);
        return (
          <li key={row.documentId} className="flex items-center justify-between gap-3">
            <Link
              href={`/dashboard/employees/${row.employeeId}/documents`}
              className="min-w-0 flex-1 truncate hover:underline"
            >
              <span className="font-medium">{row.employeeName}</span>
              <span className="text-muted-foreground">
                {" "}
                — {row.title} expiring on {formatDate(row.expiresAt)}
              </span>
            </Link>
            <Badge variant={urgency.variant} className="shrink-0">
              {urgency.label}
            </Badge>
          </li>
        );
      })}
    </ul>
  );
};
