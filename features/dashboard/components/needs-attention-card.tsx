import Link from "next/link";
import { UserCheckIcon, IdCardIcon, ArrowRightIcon } from "lucide-react";
import { Card } from "@/components/ui/card";

type NeedsAttentionCardProps = {
  pendingApprovalsCount: number;
  pendingIdentityDocumentReviewsCount: number;
};

export const NeedsAttentionCard = ({
  pendingApprovalsCount,
  pendingIdentityDocumentReviewsCount,
}: NeedsAttentionCardProps) => {
  if (pendingApprovalsCount === 0 && pendingIdentityDocumentReviewsCount === 0) {
    return null;
  }

  return (
    <Card className="border-l-4 border-l-primary p-4">
      <p className="mb-3 text-sm font-semibold">Needs your attention</p>
      <div className="flex flex-col gap-2 sm:flex-row">
        {pendingApprovalsCount > 0 && (
          <Link
            href="/dashboard/approvals"
            className="flex flex-1 items-center gap-2.5 rounded-lg bg-muted px-3 py-2.5 text-sm transition-colors hover:bg-muted/70"
          >
            <UserCheckIcon className="size-4.5 shrink-0 text-muted-foreground" />
            <span className="flex-1">
              <span className="font-medium tabular-nums">{pendingApprovalsCount}</span> account request
              {pendingApprovalsCount === 1 ? "" : "s"} waiting for approval
            </span>
            <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground" />
          </Link>
        )}
        {pendingIdentityDocumentReviewsCount > 0 && (
          <Link
            href="/dashboard/identity-documents"
            className="flex flex-1 items-center gap-2.5 rounded-lg bg-muted px-3 py-2.5 text-sm transition-colors hover:bg-muted/70"
          >
            <IdCardIcon className="size-4.5 shrink-0 text-muted-foreground" />
            <span className="flex-1">
              <span className="font-medium tabular-nums">{pendingIdentityDocumentReviewsCount}</span> ID document
              {pendingIdentityDocumentReviewsCount === 1 ? "" : "s"} waiting for review
            </span>
            <ArrowRightIcon className="size-4 shrink-0 text-muted-foreground" />
          </Link>
        )}
      </div>
    </Card>
  );
};
