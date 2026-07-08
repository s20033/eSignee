import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { documentCategoryLabel } from "@/lib/documents/category-labels";
import type { Document } from "@/types/document";
import type { signatures } from "@/drizzle/schema";

type EmailHistoryEntry = {
  to: string;
  sentAt: Date;
};

type DocumentAuditReportProps = {
  document: Document;
  verificationCount: number;
  signatureRows: (typeof signatures.$inferSelect)[];
  emailHistory: EmailHistoryEntry[];
  qrDataUrl: string;
  verifyUrl: string;
};

const Field = ({ label, value }: { label: string; value: React.ReactNode }) => (
  <div>
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-sm break-all">{value}</p>
  </div>
);

export const DocumentAuditReport = ({
  document,
  verificationCount,
  signatureRows,
  emailHistory,
  qrDataUrl,
  verifyUrl,
}: DocumentAuditReportProps) => (
  <div className="grid gap-4 sm:grid-cols-2">
    <Card>
      <CardHeader>
        <CardTitle>Integrity</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <Field label="SHA-256" value={document.sha256Hash ?? "Not yet generated"} />
        <Field label="Version" value={`v${document.currentVersion}`} />
        <Field label="Category" value={documentCategoryLabel(document)} />
        <Field label="Verification count" value={verificationCount} />
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Verification QR</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center gap-4">
        <Image src={qrDataUrl} alt="Verification QR code" width={100} height={100} unoptimized />
        <a href={verifyUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-primary underline break-all">
          {verifyUrl}
        </a>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Signatures</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {signatureRows.length === 0 && <p className="text-sm text-muted-foreground">No signatures recorded yet.</p>}
        {signatureRows.map((signature) => (
          <div key={signature.id} className="space-y-1 border-b pb-2 text-sm last:border-0">
            <p className="font-medium">{signature.signerEmail}</p>
            <p className="text-xs text-muted-foreground">{signature.signedAt.toLocaleString()}</p>
            <p className="text-xs text-muted-foreground">IP: {signature.ipAddress ?? "unknown"}</p>
            <p className="text-xs text-muted-foreground break-all">Browser: {signature.userAgent ?? "unknown"}</p>
          </div>
        ))}
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Email history</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {emailHistory.length === 0 && <p className="text-sm text-muted-foreground">No emails sent yet.</p>}
        {emailHistory.map((entry, index) => (
          <div key={index} className="flex items-center justify-between text-sm">
            <span>{entry.to}</span>
            <span className="text-xs text-muted-foreground">{entry.sentAt.toLocaleString()}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  </div>
);
