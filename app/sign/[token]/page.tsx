import { SignForm } from "@/features/documents/components/sign-form";
import {
  getSigningSession,
  getSigningSessionPreviewUrls,
  logDocumentViewed,
} from "@/features/documents/signing-actions";

type SignPageProps = {
  params: Promise<{ token: string }>;
};

const SignPage = async ({ params }: SignPageProps) => {
  const { token } = await params;
  const session = await getSigningSession(token);

  if (session.length === 0) {
    return (
      <div className="mx-auto max-w-md space-y-2 px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Link no longer valid</h1>
        <p className="text-sm text-muted-foreground">
          This signing link is invalid, expired, or has already been used.
        </p>
      </div>
    );
  }

  const previews = await getSigningSessionPreviewUrls(token);
  await Promise.all(session.map(({ document }) => logDocumentViewed(document.id)));

  const { companyName, partyName } = session[0];

  return (
    <div className="mx-auto max-w-2xl space-y-6 px-4 py-10">
      <div>
        <h1 className="text-2xl font-semibold">
          {session.length === 1 ? session[0].document.title : `${session.length} documents to sign`}
        </h1>
        <p className="text-sm text-muted-foreground">
          Sent by {companyName} to {partyName}
        </p>
      </div>

      <ul className="space-y-1">
        {previews.map((preview) => (
          <li key={preview.documentId} className="text-sm">
            {preview.previewUrl ? (
              <a
                href={preview.previewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary underline"
              >
                {preview.title} (PDF)
              </a>
            ) : (
              <span className="text-muted-foreground">{preview.title}</span>
            )}
          </li>
        ))}
      </ul>

      <SignForm token={token} companyName={companyName} />
    </div>
  );
};

export default SignPage;
