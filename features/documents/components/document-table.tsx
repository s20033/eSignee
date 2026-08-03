"use client";

import Link from "next/link";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { useRowSelection } from "@/hooks/use-row-selection";
import { DownloadDocumentButton } from "./download-document-button";
import { BulkDeleteDocumentsDialog } from "./bulk-delete-documents-dialog";
import { DOCUMENT_STATUS_LABELS } from "@/lib/documents/status-labels";
import { documentCategoryLabel } from "@/lib/documents/category-labels";
import type { DocumentListItem } from "../actions";

type DocumentTableProps = {
  documents: DocumentListItem[];
};

export const DocumentTable = ({ documents }: DocumentTableProps) => {
  const documentIds = documents.map((document) => document.id);
  const selection = useRowSelection(documentIds);

  if (documents.length === 0) {
    return <p className="text-sm text-muted-foreground">No documents found.</p>;
  }

  return (
    <div className="space-y-3">
      {selection.count > 0 && (
        <div className="flex items-center justify-between rounded-lg border bg-muted/40 px-4 py-2">
          <p className="text-sm text-muted-foreground">{selection.count} selected</p>
          <BulkDeleteDocumentsDialog documentIds={selection.selectedIds} onDeleted={selection.clear} />
        </div>
      )}
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox
                checked={selection.allSelected}
                onCheckedChange={(checked) => selection.toggleAll(checked === true)}
                aria-label="Select all documents"
              />
            </TableHead>
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
                <Checkbox
                  checked={selection.isSelected(document.id)}
                  onCheckedChange={(checked) => selection.toggle(document.id, checked === true)}
                  aria-label={`Select ${document.title}`}
                />
              </TableCell>
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
    </div>
  );
};
