import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTab, TabsPanel } from "@/components/ui/tabs";
import { CompanySettingsForm } from "@/features/settings/components/company-settings-form";
import { getCompanySettings } from "@/features/settings/actions";
import { MfaSettings } from "@/features/auth/components/mfa-settings";
import { listMfaFactors } from "@/features/auth/mfa-actions";
import { LEGAL_2026 } from "@/lib/legal/constants";

const SettingsPage = async () => {
  const [defaultValues, mfaFactors] = await Promise.all([getCompanySettings(), listMfaFactors()]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Company details used on generated document letterheads.
        </p>
      </div>

      <Tabs defaultValue="company">
        <TabsList>
          <TabsTab value="company">Company</TabsTab>
          <TabsTab value="statutory">Statutory minimums</TabsTab>
          <TabsTab value="security">Security</TabsTab>
        </TabsList>

        <TabsPanel value="company">
          <CompanySettingsForm defaultValues={defaultValues} />
        </TabsPanel>

        <TabsPanel value="statutory">
          <Card className="max-w-md space-y-2 p-4">
            <h2 className="text-sm font-semibold text-muted-foreground">
              Statutory minimums ({LEGAL_2026.year})
            </h2>
            <dl className="grid grid-cols-2 gap-y-1 text-sm">
              <dt className="text-muted-foreground">Min. hourly rate (zlecenie)</dt>
              <dd>{LEGAL_2026.minHourlyRateZlecenieGrossPln} PLN gross</dd>
              <dt className="text-muted-foreground">Min. monthly wage (o pracę)</dt>
              <dd>{LEGAL_2026.minMonthlyWageGrossPln} PLN gross</dd>
              <dt className="text-muted-foreground">Notice period (zlecenie)</dt>
              <dd>{LEGAL_2026.zlecenieNoticePeriodDays} days</dd>
              <dt className="text-muted-foreground">Notice period (o pracę)</dt>
              <dd>{LEGAL_2026.standardNoticePeriodDays} days</dd>
            </dl>
            <p className="text-xs text-muted-foreground">
              Read-only reference used as the default in the Contract Builder — update{" "}
              <code>lib/legal/constants.ts</code> when the law changes.
            </p>
          </Card>
        </TabsPanel>

        <TabsPanel value="security">
          <MfaSettings factors={mfaFactors} />
        </TabsPanel>
      </Tabs>
    </div>
  );
};

export default SettingsPage;
