import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { DOCUMENT_STATUS_LABELS } from "@/lib/documents/status-labels";
import type { DocumentListItem } from "@/features/documents/actions";

type RecentDocumentsProps = {
  documents: DocumentListItem[];
};

export const RecentDocuments = ({ documents }: RecentDocumentsProps) => {
  if (documents.length === 0) {
    return <p className="text-sm text-muted-foreground">No documents generated yet.</p>;
  }

  return (
    <ul className="space-y-3 text-sm">
      {documents.map((document) => (
        <li key={document.id} className="flex items-center justify-between gap-3">
          <Link href={`/dashboard/documents/${document.id}`} className="min-w-0 flex-1 truncate hover:underline">
            <span className="font-medium">{document.title}</span>
            <span className="text-muted-foreground"> — {document.partyName}</span>
          </Link>
          <Badge variant="outline" className="shrink-0">
            {DOCUMENT_STATUS_LABELS[document.status]}
          </Badge>
        </li>
      ))}
    </ul>
  );
};
