-- Defense-in-depth RLS. The running app enforces tenant isolation in every
-- Server Action via `tenant_id`/`employer_id` WHERE clauses, using a direct
-- postgres connection (DATABASE_URL) that — like any Postgres superuser/owner
-- role — bypasses RLS. These policies do NOT change that; they exist to
-- protect any other access path to this database (Supabase Studio,
-- PostgREST, a future service-role slip-up) in case app-layer filtering is
-- ever missed or misused elsewhere.
--
-- current_tenant_id() is SECURITY DEFINER so it can read `profiles` without
-- recursing into the RLS policy defined on `profiles` itself below.

CREATE OR REPLACE FUNCTION public.current_tenant_id()
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT tenant_id FROM public.profiles WHERE id = auth.uid()
$$;

--> statement-breakpoint

ALTER TABLE "tenants" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DO $$ BEGIN
  CREATE POLICY "tenants_select_own" ON "tenants" FOR SELECT TO authenticated
    USING ("id" = public.current_tenant_id());
EXCEPTION WHEN duplicate_object OR duplicate_table THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE POLICY "tenants_update_own" ON "tenants" FOR UPDATE TO authenticated
    USING ("id" = public.current_tenant_id());
EXCEPTION WHEN duplicate_object OR duplicate_table THEN null;
END $$;

--> statement-breakpoint

ALTER TABLE "tenant_document_settings" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DO $$ BEGIN
  CREATE POLICY "tenant_document_settings_all_own" ON "tenant_document_settings" FOR ALL TO authenticated
    USING ("tenant_id" = public.current_tenant_id())
    WITH CHECK ("tenant_id" = public.current_tenant_id());
EXCEPTION WHEN duplicate_object OR duplicate_table THEN null;
END $$;

--> statement-breakpoint

ALTER TABLE "profiles" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DO $$ BEGIN
  CREATE POLICY "profiles_select_own_tenant" ON "profiles" FOR SELECT TO authenticated
    USING ("id" = auth.uid() OR "tenant_id" = public.current_tenant_id());
EXCEPTION WHEN duplicate_object OR duplicate_table THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE POLICY "profiles_update_self" ON "profiles" FOR UPDATE TO authenticated
    USING ("id" = auth.uid())
    WITH CHECK ("id" = auth.uid());
EXCEPTION WHEN duplicate_object OR duplicate_table THEN null;
END $$;

--> statement-breakpoint

ALTER TABLE "employees" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DO $$ BEGIN
  CREATE POLICY "employees_all_own_tenant" ON "employees" FOR ALL TO authenticated
    USING ("tenant_id" = public.current_tenant_id())
    WITH CHECK ("tenant_id" = public.current_tenant_id());
EXCEPTION WHEN duplicate_object OR duplicate_table THEN null;
END $$;

--> statement-breakpoint

ALTER TABLE "templates" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DO $$ BEGIN
  CREATE POLICY "templates_all_own_tenant" ON "templates" FOR ALL TO authenticated
    USING ("tenant_id" = public.current_tenant_id())
    WITH CHECK ("tenant_id" = public.current_tenant_id());
EXCEPTION WHEN duplicate_object OR duplicate_table THEN null;
END $$;

--> statement-breakpoint

ALTER TABLE "documents" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DO $$ BEGIN
  CREATE POLICY "documents_all_own_tenant" ON "documents" FOR ALL TO authenticated
    USING ("tenant_id" = public.current_tenant_id())
    WITH CHECK ("tenant_id" = public.current_tenant_id());
EXCEPTION WHEN duplicate_object OR duplicate_table THEN null;
END $$;

--> statement-breakpoint

ALTER TABLE "document_versions" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DO $$ BEGIN
  CREATE POLICY "document_versions_all_own_tenant" ON "document_versions" FOR ALL TO authenticated
    USING (EXISTS (
      SELECT 1 FROM "documents" d
      WHERE d."id" = "document_versions"."document_id"
        AND d."tenant_id" = public.current_tenant_id()
    ))
    WITH CHECK (EXISTS (
      SELECT 1 FROM "documents" d
      WHERE d."id" = "document_versions"."document_id"
        AND d."tenant_id" = public.current_tenant_id()
    ));
EXCEPTION WHEN duplicate_object OR duplicate_table THEN null;
END $$;

--> statement-breakpoint

ALTER TABLE "signatures" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DO $$ BEGIN
  CREATE POLICY "signatures_all_own_tenant" ON "signatures" FOR ALL TO authenticated
    USING (EXISTS (
      SELECT 1 FROM "documents" d
      WHERE d."id" = "signatures"."document_id"
        AND d."tenant_id" = public.current_tenant_id()
    ))
    WITH CHECK (EXISTS (
      SELECT 1 FROM "documents" d
      WHERE d."id" = "signatures"."document_id"
        AND d."tenant_id" = public.current_tenant_id()
    ));
EXCEPTION WHEN duplicate_object OR duplicate_table THEN null;
END $$;

--> statement-breakpoint

ALTER TABLE "audit_logs" ENABLE ROW LEVEL SECURITY;
--> statement-breakpoint
DO $$ BEGIN
  CREATE POLICY "audit_logs_select_own_tenant" ON "audit_logs" FOR SELECT TO authenticated
    USING ("tenant_id" = public.current_tenant_id());
EXCEPTION WHEN duplicate_object OR duplicate_table THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
  CREATE POLICY "audit_logs_insert_own_tenant" ON "audit_logs" FOR INSERT TO authenticated
    WITH CHECK ("tenant_id" = public.current_tenant_id());
EXCEPTION WHEN duplicate_object OR duplicate_table THEN null;
END $$;
