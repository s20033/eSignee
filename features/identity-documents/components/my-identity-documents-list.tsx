import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { IDENTITY_DOCUMENT_TYPE_LABELS } from "../schema";
import { getMyIdentityDocumentSignedUrl } from "../actions";
import { ViewIdentityDocumentButton } from "./view-identity-document-button";
import type { identityDocuments } from "@/drizzle/schema";

const STATUS_BADGE: Record<
  (typeof identityDocuments.$inferSelect)["verificationStatus"],
  { label: string; variant: "secondary" | "default" | "destructive" }
> = {
  pending_review: { label: "Pending review", variant: "secondary" },
  verified: { label: "Verified", variant: "default" },
  rejected: { label: "Rejected", variant: "destructive" },
};

type MyIdentityDocumentsListProps = {
  documents: (typeof identityDocuments.$inferSelect)[];
};

export const MyIdentityDocumentsList = ({ documents }: MyIdentityDocumentsListProps) => {
  if (documents.length === 0) {
    return <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>;
  }

  return (
    <div className="space-y-3">
      {documents.map((doc) => {
        const status = STATUS_BADGE[doc.verificationStatus];
        return (
          <Card key={doc.id} className="flex items-center justify-between gap-3 p-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">{IDENTITY_DOCUMENT_TYPE_LABELS[doc.type]}</span>
                <Badge variant={status.variant}>{status.label}</Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {doc.documentNumber ? `${doc.documentNumber} · ` : ""}
                Uploaded {doc.createdAt.toLocaleDateString()}
                {doc.expiryDate ? ` · Expires ${new Date(doc.expiryDate).toLocaleDateString()}` : ""}
              </p>
              {doc.verificationStatus === "rejected" && doc.rejectionReason && (
                <p className="text-xs text-destructive">Reason: {doc.rejectionReason}</p>
              )}
            </div>
            <ViewIdentityDocumentButton id={doc.id} getUrl={getMyIdentityDocumentSignedUrl} />
          </Card>
        );
      })}
    </div>
  );
};
