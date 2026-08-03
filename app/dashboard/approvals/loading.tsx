import { PageHeaderSkeleton } from "@/components/shared/page-header-skeleton";
import { TableSkeleton } from "@/components/shared/table-skeleton";

const ApprovalsLoading = () => (
  <div className="space-y-6">
    <PageHeaderSkeleton />
    <TableSkeleton columns={4} />
  </div>
);

export default ApprovalsLoading;
