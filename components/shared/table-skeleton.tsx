import { Skeleton } from "@/components/ui/skeleton";

type TableSkeletonProps = {
  rows?: number;
  columns?: number;
};

export const TableSkeleton = ({ rows = 5, columns = 4 }: TableSkeletonProps) => (
  <div className="space-y-4">
    <div className="flex gap-4 border-b pb-2">
      {Array.from({ length: columns }).map((_, colIndex) => (
        <Skeleton key={colIndex} className="h-3 w-20" />
      ))}
    </div>
    {Array.from({ length: rows }).map((_, rowIndex) => (
      <div key={rowIndex} className="flex items-center gap-4">
        {Array.from({ length: columns }).map((__, colIndex) => (
          <Skeleton key={colIndex} className="h-4 flex-1" />
        ))}
      </div>
    ))}
  </div>
);
