import { Badge } from "@/components/ui/badge";
import { getVerificationInfo } from "@/features/documents/verify-actions";

type VerifyPageProps = {
  params: Promise<{ documentId: string }>;
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Draft (not yet sent)",
  waiting: "Awaiting employee signature",
  employee_signed: "Awaiting employer signature",
  completed: "Completed and signed",
  archived: "Archived",
};

const VerifyPage = async ({ params }: VerifyPageProps) => {
  const { documentId } = await params;
  const info = await getVerificationInfo(documentId);

  if (!info) {
    return (
      <div className="mx-auto max-w-md space-y-2 px-4 py-16 text-center">
        <h1 className="text-xl font-semibold">Document not found</h1>
        <p className="text-sm text-muted-foreground">
          This verification code does not match any known document.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md space-y-4 px-4 py-16 text-center">
      <h1 className="text-xl font-semibold">{info.title}</h1>
      <p className="text-sm text-muted-foreground">Issued by {info.companyName}</p>
      <Badge variant={info.status === "completed" ? "default" : "secondary"}>
        {STATUS_LABELS[info.status] ?? info.status}
      </Badge>
      <p className="text-sm text-muted-foreground">
        Generated {info.createdAt.toLocaleDateString()}
      </p>
      {info.signatureDates.length > 0 && (
        <p className="text-sm text-muted-foreground">
          {info.signatureDates.length} signature(s) recorded, most recently{" "}
          {new Date(Math.max(...info.signatureDates.map((d) => d.getTime()))).toLocaleDateString()}
        </p>
      )}
    </div>
  );
};

export default VerifyPage;
