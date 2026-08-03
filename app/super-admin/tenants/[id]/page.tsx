import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeftIcon } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PlanSelector } from "@/features/super-admin/components/plan-selector";
import { StatusToggle } from "@/features/super-admin/components/status-toggle";
import { ImpersonateButton } from "@/features/super-admin/components/impersonate-button";
import { getTenantDetail } from "@/features/super-admin/actions";

type TenantDetailPageProps = {
  params: Promise<{ id: string }>;
};

const TenantDetailPage = async ({ params }: TenantDetailPageProps) => {
  const { id } = await params;
  const detail = await getTenantDetail(id);

  if (!detail) {
    notFound();
  }

  const { tenant, admins, employeeTotal, documentTotal } = detail;

  return (
    <div className="space-y-6">
      <Link href="/super-admin" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeftIcon className="size-4" />
        Back to tenants
      </Link>

      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">{tenant.name}</h1>
          <p className="text-sm text-muted-foreground">Created {tenant.createdAt.toLocaleDateString()}</p>
        </div>
        <div className="flex items-center gap-2">
          <PlanSelector tenantId={tenant.id} plan={tenant.plan} />
          <StatusToggle tenantId={tenant.id} status={tenant.status} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Status</p>
          <Badge variant={tenant.status === "active" ? "default" : "destructive"} className="mt-1">
            {tenant.status}
          </Badge>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Employees</p>
          <p className="text-2xl font-semibold">{employeeTotal}</p>
        </Card>
        <Card className="p-4">
          <p className="text-xs text-muted-foreground">Documents</p>
          <p className="text-2xl font-semibold">{documentTotal}</p>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Admins</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {admins.length === 0 ? (
            <p className="text-sm text-muted-foreground">No admins on this tenant.</p>
          ) : (
            admins.map((admin) => (
              <div key={admin.id} className="flex items-center justify-between text-sm">
                <span>{admin.email}</span>
                <Badge variant="secondary">{admin.status}</Badge>
              </div>
            ))
          )}
          <div className="pt-2">
            <ImpersonateButton tenantId={tenant.id} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TenantDetailPage;
