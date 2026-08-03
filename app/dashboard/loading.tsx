import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { StatCardsSkeleton } from "@/components/shared/stat-cards-skeleton";

const DashboardLoading = () => (
  <div className="space-y-6">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-2">
        <Skeleton className="h-8 w-40" />
        <Skeleton className="h-4 w-72" />
      </div>
      <Skeleton className="h-9 w-36" />
    </div>

    <StatCardsSkeleton />

    <div className="grid gap-4 lg:grid-cols-3">
      <Card className="space-y-3 p-5 lg:col-span-2">
        <Skeleton className="h-4 w-48" />
        <Skeleton className="h-48 w-full" />
      </Card>
      <Card className="space-y-3 p-5">
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-48 w-full" />
      </Card>
    </div>

    <div className="grid gap-4 lg:grid-cols-3">
      <div className="space-y-4 lg:col-span-2">
        {Array.from({ length: 3 }).map((_, index) => (
          <Card key={index} className="space-y-3 p-5">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
          </Card>
        ))}
      </div>
      <div className="space-y-4">
        {Array.from({ length: 2 }).map((_, index) => (
          <Card key={index} className="space-y-3 p-5">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </Card>
        ))}
      </div>
    </div>
  </div>
);

export default DashboardLoading;
