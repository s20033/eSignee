-- Defense-in-depth RLS, same rationale as every other table (Phase 1's
-- 0014_tenant_rls_policies.sql). No direct tenant_id column on this table,
-- so scope via a join to identity_documents instead — the cron route that
-- actually writes here uses the Drizzle service connection, which bypasses
-- RLS like everywhere else in this app.

ALTER TABLE "identity_document_reminders" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DO $$ BEGIN
  CREATE POLICY "identity_document_reminders_select_own_tenant" ON "identity_document_reminders" FOR SELECT TO authenticated
    USING (EXISTS (
      SELECT 1 FROM "identity_documents" d
      WHERE d."id" = "identity_document_reminders"."identity_document_id"
        AND d."tenant_id" = public.current_tenant_id()
    ));
EXCEPTION WHEN duplicate_object OR duplicate_table THEN null;
END $$;
