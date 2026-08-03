import { IdentityDocumentReviewTable } from "@/features/identity-documents/components/identity-document-review-table";
import { listPendingIdentityDocumentReviews } from "@/features/identity-documents/actions";

const IdentityDocumentsReviewPage = async () => {
  const requests = await listPendingIdentityDocumentReviews();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">ID document reviews</h1>
        <p className="text-sm text-muted-foreground">
          Verify or reject identity documents employees have uploaded.
        </p>
      </div>

      <IdentityDocumentReviewTable requests={requests} />
    </div>
  );
};

export default IdentityDocumentsReviewPage;
