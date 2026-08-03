import { MyDocumentList } from "@/features/employee-portal/components/my-document-list";
import { UploadDocumentForm } from "@/features/document-uploads/components/upload-document-form";
import { listMyDocumentBundles } from "@/features/employee-portal/actions";

const PortalDocumentsPage = async () => {
  const bundles = await listMyDocumentBundles();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Documents</h1>
        <p className="text-sm text-muted-foreground">
          Documents your employer has sent you, and documents you&apos;ve uploaded for their signature.
        </p>
      </div>

      <UploadDocumentForm />
      <MyDocumentList bundles={bundles} />
    </div>
  );
};

export default PortalDocumentsPage;
