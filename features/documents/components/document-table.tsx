import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { DownloadDocumentButton } from "./download-document-button";
import { DOCUMENT_STATUS_LABELS } from "@/lib/documents/status-labels";
import { documentCategoryLabel } from "@/lib/documents/category-labels";
import type { DocumentListItem } from "../actions";

type DocumentTableProps = {
  documents: DocumentListItem[];
};

export const DocumentTable = ({ documents }: DocumentTableProps) => {
  if (documents.length === 0) {
    return <p className="text-sm text-muted-foreground">No documents found.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Title</TableHead>
          <TableHead>Employee</TableHead>
          <TableHead>Category</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {documents.map((document) => (
          <TableRow key={document.id}>
            <TableCell>
              <Link href={`/dashboard/documents/${document.id}`} className="hover:underline">
                {document.title}
              </Link>
            </TableCell>
            <TableCell>{document.employeeName}</TableCell>
            <TableCell>
              <Badge variant="secondary">{documentCategoryLabel(document)}</Badge>
            </TableCell>
            <TableCell>
              <Badge variant="outline">{DOCUMENT_STATUS_LABELS[document.status]}</Badge>
            </TableCell>
            <TableCell>{document.createdAt.toLocaleDateString()}</TableCell>
            <TableCell className="space-x-2 text-right">
              <Button
                variant="ghost"
                size="sm"
                nativeButton={false}
                render={<Link href={`/dashboard/documents/${document.id}`} />}
              >
                View
              </Button>
              <DownloadDocumentButton documentId={document.id} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
