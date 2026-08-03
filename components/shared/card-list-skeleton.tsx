import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

type CardListSkeletonProps = {
  count?: number;
};

export const CardListSkeleton = ({ count = 3 }: CardListSkeletonProps) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, index) => (
      <Card key={index} className="space-y-3 p-4">
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-5 w-20 rounded-full" />
        </div>
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-2/3" />
      </Card>
    ))}
  </div>
);
