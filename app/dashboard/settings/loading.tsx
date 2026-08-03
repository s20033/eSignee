import { PageHeaderSkeleton } from "@/components/shared/page-header-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

const SettingsLoading = () => (
  <div className="space-y-6">
    <PageHeaderSkeleton />
    <div className="flex gap-2">
      <Skeleton className="h-8 w-20" />
      <Skeleton className="h-8 w-32" />
      <Skeleton className="h-8 w-20" />
    </div>
    <div className="max-w-md space-y-4">
      {Array.from({ length: 5 }).map((_, index) => (
        <div key={index} className="space-y-2">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="h-9 w-full" />
        </div>
      ))}
    </div>
  </div>
);

export default SettingsLoading;
