import type { LucideIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

type StatCardProps = {
  label: string;
  value: number | string;
  icon: LucideIcon;
  description?: string;
};

export const StatCard = ({ label, value, icon: Icon, description }: StatCardProps) => (
  <Card className="p-5">
    <div className="flex items-start justify-between gap-3">
      <div className="space-y-1">
        <p className="text-sm text-muted-foreground">{label}</p>
        <p className="text-3xl font-semibold tracking-tight">{value}</p>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>
      <div className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-muted">
        <Icon className="size-4.5" />
      </div>
    </div>
  </Card>
);
