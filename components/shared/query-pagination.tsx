"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";

type QueryPaginationProps = {
  page: number;
  totalPages: number;
};

export const QueryPagination = ({ page, totalPages }: QueryPaginationProps) => {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  if (totalPages <= 1) {
    return null;
  }

  const goToPage = (next: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(next));
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <div className="flex items-center justify-between gap-4">
      <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => goToPage(page - 1)}>
        Previous
      </Button>
      <span className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={page >= totalPages}
        onClick={() => goToPage(page + 1)}
      >
        Next
      </Button>
    </div>
  );
};
