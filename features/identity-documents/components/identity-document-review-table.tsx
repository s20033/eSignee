import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { IDENTITY_DOCUMENT_TYPE_LABELS } from "../schema";
import { getIdentityDocumentReviewUrl, type listPendingIdentityDocumentReviews } from "../actions";
import { ViewIdentityDocumentButton } from "./view-identity-document-button";
import { VerifyButton } from "./verify-button";
import { RejectIdentityDocumentDialog } from "./reject-identity-document-dialog";

type PendingReview = Awaited<ReturnType<typeof listPendingIdentityDocumentReviews>>[number];

type IdentityDocumentReviewTableProps = {
  requests: PendingReview[];
};

export const IdentityDocumentReviewTable = ({ requests }: IdentityDocumentReviewTableProps) => {
  if (requests.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">No identity documents waiting for review.</p>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Employee</TableHead>
          <TableHead>Type</TableHead>
          <TableHead>Document number</TableHead>
          <TableHead>Expiry</TableHead>
          <TableHead>Uploaded</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.map((request) => (
          <TableRow key={request.id}>
            <TableCell>{request.employeeName}</TableCell>
            <TableCell>{IDENTITY_DOCUMENT_TYPE_LABELS[request.type]}</TableCell>
            <TableCell>{request.documentNumber ?? "—"}</TableCell>
            <TableCell>{request.expiryDate ? new Date(request.expiryDate).toLocaleDateString() : "—"}</TableCell>
            <TableCell>{request.createdAt.toLocaleDateString()}</TableCell>
            <TableCell className="space-x-2 text-right">
              <ViewIdentityDocumentButton id={request.id} getUrl={getIdentityDocumentReviewUrl} />
              <VerifyButton id={request.id} />
              <RejectIdentityDocumentDialog id={request.id} employeeName={request.employeeName} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
