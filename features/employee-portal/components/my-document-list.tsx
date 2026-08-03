import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { DOCUMENT_STATUS_LABELS } from "@/lib/documents/status-labels";
import { documentCategoryLabel } from "@/lib/documents/category-labels";
import { DownloadMyDocumentButton } from "./download-my-document-button";
import type { Document } from "@/types/document";

type MyDocumentListProps = {
  bundles: { bundleId: string; documents: Document[] }[];
};

export const MyDocumentList = ({ bundles }: MyDocumentListProps) => {
  if (bundles.length === 0) {
    return <p className="text-sm text-muted-foreground">No documents yet.</p>;
  }

  return (
    <div className="space-y-4">
      {bundles.map(({ bundleId, documents }) => (
        <Card key={bundleId} className="p-4">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              Sent {documents[0]?.createdAt.toLocaleDateString()}
            </p>
            <Badge variant="secondary">{documents.length} documents</Badge>
          </div>
          <ul className="space-y-2">
            {documents.map((document) => (
              <li key={document.id} className="flex items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2">
                  <span>{document.title}</span>
                  <Badge variant="outline">{DOCUMENT_STATUS_LABELS[document.status]}</Badge>
                  <Badge variant="secondary">{documentCategoryLabel(document)}</Badge>
                </div>
                {document.pdfUrl && <DownloadMyDocumentButton documentId={document.id} />}
              </li>
            ))}
          </ul>
        </Card>
      ))}
    </div>
  );
};
