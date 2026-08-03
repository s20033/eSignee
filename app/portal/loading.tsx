import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeaderSkeleton } from "@/components/shared/page-header-skeleton";

const PortalOverviewLoading = () => (
  <div className="space-y-6">
    <PageHeaderSkeleton />
    <Card className="grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, index) => (
        <div key={index} className="space-y-1.5">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-4 w-24" />
        </div>
      ))}
    </Card>
  </div>
);

export default PortalOverviewLoading;
