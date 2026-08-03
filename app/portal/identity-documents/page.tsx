import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadIdentityDocumentForm } from "@/features/identity-documents/components/upload-identity-document-form";
import { MyIdentityDocumentsList } from "@/features/identity-documents/components/my-identity-documents-list";
import { listMyIdentityDocuments } from "@/features/identity-documents/actions";

const PortalIdentityDocumentsPage = async () => {
  const documents = await listMyIdentityDocuments();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">ID documents</h1>
        <p className="text-sm text-muted-foreground">
          Upload your passport, national ID, work permit, or visa for your employer to verify.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Upload a document</CardTitle>
        </CardHeader>
        <CardContent>
          <UploadIdentityDocumentForm />
        </CardContent>
      </Card>

      <MyIdentityDocumentsList documents={documents} />
    </div>
  );
};

export default PortalIdentityDocumentsPage;
