-- Defense-in-depth RLS for signees, same rationale and current_tenant_id()
-- helper as Phase 1's 0014_tenant_rls_policies.sql. Real enforcement for this
-- table's rows is the tenantId/employerId filtering in features/signees/actions.ts,
-- run over the Drizzle service connection.

ALTER TABLE "signees" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DO $$ BEGIN
  CREATE POLICY "signees_all_own_tenant" ON "signees" FOR ALL TO authenticated
    USING ("tenant_id" = public.current_tenant_id())
    WITH CHECK ("tenant_id" = public.current_tenant_id());
EXCEPTION WHEN duplicate_object OR duplicate_table THEN null;
END $$;
