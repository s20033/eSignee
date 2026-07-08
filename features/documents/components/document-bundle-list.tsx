import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DownloadDocumentButton } from "./download-document-button";
import { CopySigningLinkButton } from "./copy-signing-link-button";
import { SignAsEmployerDialog } from "./sign-as-employer-dialog";
import { DOCUMENT_STATUS_LABELS } from "@/lib/documents/status-labels";
import { documentCategoryLabel } from "@/lib/documents/category-labels";
import type { Document } from "@/types/document";

type DocumentBundleListProps = {
  bundles: { bundleId: string; documents: Document[] }[];
};

const canSignAsEmployer = (document: Document) =>
  (document.signatureType === "employer" && document.status === "draft") ||
  (document.signatureType === "two-party" && document.status === "employee_signed");

export const DocumentBundleList = ({ bundles }: DocumentBundleListProps) => {
  if (bundles.length === 0) {
    return <p className="text-sm text-muted-foreground">No documents generated yet.</p>;
  }

  return (
    <div className="space-y-4">
      {bundles.map(({ bundleId, documents }) => (
        <Card key={bundleId} className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Generated {documents[0]?.createdAt.toLocaleDateString()}
            </p>
            <Badge variant="secondary">{documents.length} documents</Badge>
          </div>
          <ul className="space-y-2">
            {documents.map((document) => (
              <li key={document.id} className="flex items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <Link href={`/dashboard/documents/${document.id}`} className="hover:underline">
                    {document.title}
                  </Link>
                  <Badge variant="outline">{DOCUMENT_STATUS_LABELS[document.status]}</Badge>
                  <Badge variant="secondary">{documentCategoryLabel(document)}</Badge>
                </div>
                <div className="flex items-center">
                  {document.status === "waiting" && document.signingToken && (
                    <CopySigningLinkButton token={document.signingToken} />
                  )}
                  {canSignAsEmployer(document) && <SignAsEmployerDialog documentId={document.id} />}
                  <DownloadDocumentButton documentId={document.id} />
                </div>
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  );
};
