import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { IDENTITY_DOCUMENT_TYPE_LABELS, VERIFICATION_STATUS_BADGE } from "../schema";
import { getIdentityDocumentReviewUrl, type listIdentityDocumentsForEmployee } from "../actions";
import { ViewIdentityDocumentButton } from "./view-identity-document-button";
import { DeleteIdentityDocumentDialog } from "./delete-identity-document-dialog";

type EmployeeIdentityDocument = Awaited<ReturnType<typeof listIdentityDocumentsForEmployee>>[number];

type EmployeeIdentityDocumentsTableProps = {
  documents: EmployeeIdentityDocument[];
};

export const EmployeeIdentityDocumentsTable = ({ documents }: EmployeeIdentityDocumentsTableProps) => {
  if (documents.length === 0) {
    return <p className="text-sm text-muted-foreground">No identity documents uploaded yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Type</TableHead>
          <TableHead>Document number</TableHead>
          <TableHead>Expiry</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Uploaded</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {documents.map((document) => {
          const typeLabel = IDENTITY_DOCUMENT_TYPE_LABELS[document.type];
          const status = VERIFICATION_STATUS_BADGE[document.verificationStatus];

          return (
            <TableRow key={document.id}>
              <TableCell>{typeLabel}</TableCell>
              <TableCell>{document.documentNumber ?? "—"}</TableCell>
              <TableCell>{document.expiryDate ? new Date(document.expiryDate).toLocaleDateString() : "—"}</TableCell>
              <TableCell>
                <Badge variant={status.variant}>{status.label}</Badge>
              </TableCell>
              <TableCell>{document.createdAt.toLocaleDateString()}</TableCell>
              <TableCell className="space-x-2 text-right">
                <ViewIdentityDocumentButton id={document.id} getUrl={getIdentityDocumentReviewUrl} />
                <DeleteIdentityDocumentDialog id={document.id} typeLabel={typeLabel} />
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
};
