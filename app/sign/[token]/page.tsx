import { SignForm } from "@/features/documents/components/sign-form";
import {
  getDocumentBySigningToken,
  getSigningDocumentPreviewUrl,
} from "@/features/documents/signing-actions";

type SignPageProps = {
  params: Promise<{ token: string }>;
};

const SignPage = async ({ params }: SignPageProps) => {
  const { token } = await params;
  const row = await getDocumentBySigningToken(token);

  if (!row) {
    return (
      <div className="mx-auto max-w-md space-y-2 px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Link no longer valid</h1>
        <p className="text-sm text-muted-foreground">
          This signing link is invalid, expired, or has already been used.
        </p>
      </div>
    );
  }

  const previewUrl = await getSigningDocumentPreviewUrl(token);

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold">{row.document.title}</h1>
        <p className="text-sm text-muted-foreground">
          Sent by {row.companyName} to {row.employeeName}
        </p>
      </div>

      {previewUrl && (
        <a
          href={previewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-block text-sm text-primary underline"
        >
          View document (PDF)
        </a>
      )}

      <SignForm token={token} />
    </div>
  );
};

export default SignPage;
