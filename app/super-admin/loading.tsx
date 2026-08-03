import { PageHeaderSkeleton } from "@/components/shared/page-header-skeleton";
import { TableSkeleton } from "@/components/shared/table-skeleton";

const SuperAdminLoading = () => (
  <div className="space-y-6">
    <PageHeaderSkeleton />
    <TableSkeleton columns={7} />
  </div>
);

export default SuperAdminLoading;
