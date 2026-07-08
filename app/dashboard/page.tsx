import Link from "next/link";
import {
  UsersIcon,
  FileTextIcon,
  FilesIcon,
  ClockIcon,
  CheckCircle2Icon,
  TrendingUpIcon,
  UserPlusIcon,
  FilePlusIcon,
  CalendarClockIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StatCard } from "@/features/dashboard/components/stat-card";
import { ContractExpiryTracker } from "@/features/dashboard/components/contract-expiry-tracker";
import { MonthlyDocumentsChart } from "@/features/dashboard/components/monthly-documents-chart";
import { DocumentStatusPieChart } from "@/features/dashboard/components/document-status-pie-chart";
import { RecentDocuments } from "@/features/dashboard/components/recent-documents";
import { AuditTrail } from "@/features/documents/components/audit-trail";
import { listDocuments } from "@/features/documents/actions";
import {
  getDashboardStats,
  getUpcomingContractExpirations,
  getMonthlyDocumentCounts,
} from "@/features/dashboard/actions";
import { DOCUMENT_STATUS_LABELS } from "@/lib/documents/status-labels";

const DashboardPage = async () => {
  const [stats, expirations, monthlyCounts, recentDocuments] = await Promise.all([
    getDashboardStats(),
    getUpcomingContractExpirations(),
    getMonthlyDocumentCounts(),
    listDocuments("", 1),
  ]);
  const pendingSignatures = stats.documentsByStatus.waiting + stats.documentsByStatus.employee_signed;
  const totalDocuments = Object.values(stats.documentsByStatus).reduce((sum, count) => sum + count, 0);
  const completionRate = totalDocuments === 0 ? 0 : Math.round((stats.documentsByStatus.completed / totalDocuments) * 100);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
          <p className="text-sm text-muted-foreground">
            Welcome back — here&apos;s what&apos;s happening with your HR documents.
          </p>
        </div>
        <Button nativeButton={false} render={<Link href="/dashboard/employees/new" />}>
          <UserPlusIcon />
          Add employee
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Employees" value={stats.employeeCount} icon={UsersIcon} />
        <StatCard label="Templates" value={stats.templateCount} icon={FileTextIcon} />
        <StatCard label="Total documents" value={totalDocuments} icon={FilesIcon} />
        <StatCard label="Awaiting signature" value={pendingSignatures} icon={ClockIcon} />
        <StatCard label="Completed" value={stats.documentsByStatus.completed} icon={CheckCircle2Icon} />
        <StatCard label="Completion rate" value={`${completionRate}%`} icon={TrendingUpIcon} />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Documents generated per month</CardTitle>
          </CardHeader>
          <CardContent>
            <MonthlyDocumentsChart data={monthlyCounts} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Documents by status</CardTitle>
          </CardHeader>
          <CardContent>
            <DocumentStatusPieChart counts={stats.documentsByStatus} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Recent documents</CardTitle>
            </CardHeader>
            <CardContent>
              <RecentDocuments documents={recentDocuments.documents.slice(0, 5)} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarClockIcon className="size-4.5" />
                Upcoming contract expirations
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ContractExpiryTracker expirations={expirations} />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Recent activity</CardTitle>
            </CardHeader>
            <CardContent>
              <AuditTrail entries={stats.recentActivity} />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Document pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm">
                {Object.entries(stats.documentsByStatus).map(([status, count]) => (
                  <li key={status} className="flex items-center justify-between gap-3">
                    <span className="text-muted-foreground">
                      {DOCUMENT_STATUS_LABELS[status as keyof typeof DOCUMENT_STATUS_LABELS]}
                    </span>
                    <span className="font-medium tabular-nums">{count}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Quick actions</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2">
              <Button
                variant="outline"
                className="justify-start"
                nativeButton={false}
                render={<Link href="/dashboard/templates/new" />}
              >
                <FilePlusIcon />
                Create template
              </Button>
              <Button
                variant="outline"
                className="justify-start"
                nativeButton={false}
                render={<Link href="/dashboard/employees" />}
              >
                <UsersIcon />
                Manage employees
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;
