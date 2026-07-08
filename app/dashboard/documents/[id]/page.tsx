import { notFound } from "next/navigation";
import QRCode from "qrcode";
import Link from "next/link";
import { Breadcrumbs } from "@/components/shared/breadcrumbs";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTab, TabsPanel } from "@/components/ui/tabs";
import { DOCUMENT_STATUS_LABELS } from "@/lib/documents/status-labels";
import { getAppOrigin } from "@/lib/get-app-origin";
import { getDocumentDetail, getDocumentSignatures } from "@/features/documents/actions";
import { DocumentPreviewDialog } from "@/features/documents/components/document-preview-dialog";
import { DownloadDocumentButton } from "@/features/documents/components/download-document-button";
import { DocumentDeleteRestoreButton } from "@/features/documents/components/document-delete-restore-button";
import { DocumentCategoryEditor } from "@/features/documents/components/document-category-editor";
import { ResendSigningEmailButton } from "@/features/documents/components/resend-signing-email-button";
import { DocumentTimeline } from "@/features/documents/components/document-timeline";
import { DocumentVersions } from "@/features/documents/components/document-versions";
import { DocumentAuditReport } from "@/features/documents/components/document-audit-report";

type DocumentDetailPageProps = {
  params: Promise<{ id: string }>;
};

const hasPendingSignature = (status: string, signatureType: string | null) =>
  status === "waiting" ||
  status === "employee_signed" ||
  (status === "draft" && signatureType === "employer");

const DocumentDetailPage = async ({ params }: DocumentDetailPageProps) => {
  const { id } = await params;
  const detail = await getDocumentDetail(id);

  if (!detail) {
    notFound();
  }

  const { document, employeeName, versions, timeline, verificationCount } = detail;
  const signatureRows = await getDocumentSignatures(id);

  const origin = await getAppOrigin();
  const verifyUrl = `${origin}/verify/${document.id}`;
  const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 200 });

  const emailHistory = timeline
    .filter((entry) => entry.action === "document.sent")
    .map((entry) => ({
      to: (entry.metadata as { to?: string } | null)?.to ?? "unknown",
      sentAt: entry.createdAt,
    }));

  return (
    <div className="space-y-6">
      <Breadcrumbs items={[{ label: "Documents", href: "/dashboard/documents" }, { label: document.title }]} />

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-semibold">{document.title}</h1>
          <p className="text-sm text-muted-foreground">
            Employee:{" "}
            <Link href={`/dashboard/employees/${document.employeeId}/documents`} className="text-foreground hover:underline">
              {employeeName}
            </Link>
          </p>
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline">{DOCUMENT_STATUS_LABELS[document.status]}</Badge>
            <DocumentCategoryEditor
              documentId={document.id}
              category={document.category}
              customCategoryLabel={document.customCategoryLabel}
            />
            {document.deletedAt && <Badge variant="destructive">Deleted</Badge>}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <DocumentPreviewDialog documentId={document.id} title={document.title} />
          <DownloadDocumentButton documentId={document.id} />
          {!document.deletedAt && hasPendingSignature(document.status, document.signatureType) && (
            <ResendSigningEmailButton documentId={document.id} />
          )}
          <DocumentDeleteRestoreButton documentId={document.id} deleted={!!document.deletedAt} />
        </div>
      </div>

      <Tabs defaultValue="timeline">
        <TabsList>
          <TabsTab value="timeline">Timeline</TabsTab>
          <TabsTab value="versions">Versions</TabsTab>
          <TabsTab value="audit-report">Audit Report</TabsTab>
        </TabsList>
        <TabsPanel value="timeline">
          <DocumentTimeline entries={timeline} />
        </TabsPanel>
        <TabsPanel value="versions">
          <DocumentVersions documentId={document.id} versions={versions} />
        </TabsPanel>
        <TabsPanel value="audit-report">
          <DocumentAuditReport
            document={document}
            verificationCount={verificationCount}
            signatureRows={signatureRows}
            emailHistory={emailHistory}
            qrDataUrl={qrDataUrl}
            verifyUrl={verifyUrl}
          />
        </TabsPanel>
      </Tabs>
    </div>
  );
};

export default DocumentDetailPage;
