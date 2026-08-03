import { PageHeaderSkeleton } from "@/components/shared/page-header-skeleton";
import { CardListSkeleton } from "@/components/shared/card-list-skeleton";

const PortalDocumentsLoading = () => (
  <div className="space-y-6">
    <PageHeaderSkeleton />
    <CardListSkeleton />
  </div>
);

export default PortalDocumentsLoading;
