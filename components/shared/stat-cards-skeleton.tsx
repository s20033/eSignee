import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type StatCardsSkeletonProps = {
  count?: number;
};

export const StatCardsSkeleton = ({ count = 6 }: StatCardsSkeletonProps) => (
  <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
    {Array.from({ length: count }).map((_, index) => (
      <Card key={index} className="space-y-2 p-5">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-8 w-12" />
      </Card>
    ))}
  </div>
);
