import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { DownloadVersionButton } from "./download-version-button";
import type { documentVersions } from "@/drizzle/schema";

type DocumentVersionsProps = {
  documentId: string;
  versions: (typeof documentVersions.$inferSelect)[];
};

/** Immutable version history — every past PDF stays downloadable, never overwritten. */
export const DocumentVersions = ({ documentId, versions }: DocumentVersionsProps) => {
  if (versions.length === 0) {
    return <p className="text-sm text-muted-foreground">No versions recorded yet.</p>;
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Version</TableHead>
          <TableHead>Note</TableHead>
          <TableHead>SHA-256</TableHead>
          <TableHead>Recorded</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {versions.map((version) => (
          <TableRow key={version.id}>
            <TableCell>
              <Badge variant="secondary">v{version.versionNumber}</Badge>
            </TableCell>
            <TableCell>{version.note ?? "—"}</TableCell>
            <TableCell className="font-mono text-xs text-muted-foreground">
              {version.sha256Hash.slice(0, 16)}…
            </TableCell>
            <TableCell>{version.createdAt.toLocaleString()}</TableCell>
            <TableCell className="text-right">
              <DownloadVersionButton documentId={documentId} versionId={version.id} />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
};
