-- Defense-in-depth RLS for identity_documents, same rationale and
-- current_tenant_id() helper as Phase 1's 0014_tenant_rls_policies.sql.
-- Kept at tenant granularity (not per-employee) here, matching every other
-- table's RLS in this app — the actual file bytes are what need
-- per-employee protection, and that's enforced by the Storage bucket
-- policies in setup-storage.ts instead. The real enforcement for this
-- table's rows is still the tenantId/employeeId filtering in
-- features/identity-documents/actions.ts, run over the Drizzle service
-- connection.

ALTER TABLE "identity_documents" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DO $$ BEGIN
  CREATE POLICY "identity_documents_all_own_tenant" ON "identity_documents" FOR ALL TO authenticated
    USING ("tenant_id" = public.current_tenant_id())
    WITH CHECK ("tenant_id" = public.current_tenant_id());
EXCEPTION WHEN duplicate_object OR duplicate_table THEN null;
END $$;
