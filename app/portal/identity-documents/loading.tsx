import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { PageHeaderSkeleton } from "@/components/shared/page-header-skeleton";
import { CardListSkeleton } from "@/components/shared/card-list-skeleton";

const PortalIdentityDocumentsLoading = () => (
  <div className="space-y-6">
    <PageHeaderSkeleton />
    <Card>
      <CardHeader>
        <Skeleton className="h-4 w-32" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="space-y-2">
              <Skeleton className="h-3 w-24" />
              <Skeleton className="h-9 w-full" />
            </div>
          ))}
        </div>
        <Skeleton className="h-9 w-24" />
      </CardContent>
    </Card>
    <CardListSkeleton />
  </div>
);

export default PortalIdentityDocumentsLoading;
