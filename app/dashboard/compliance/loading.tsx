import { PageHeaderSkeleton } from "@/components/shared/page-header-skeleton";
import { TableSkeleton } from "@/components/shared/table-skeleton";

const ComplianceLoading = () => (
  <div className="space-y-6">
    <PageHeaderSkeleton />
    <TableSkeleton columns={5} />
  </div>
);

export default ComplianceLoading;
