-- Data migration: give every existing profile (= one employer company today)
-- its own tenants row, then backfill tenant_id across the tables that were
-- just given a nullable tenant_id column in 0011.
--
-- The new tenant row reuses the founding admin's profiles.id as its own id.
-- This is a deliberate one-time convention, not a general rule: it removes
-- any need to correlate INSERT...RETURNING rows back to their source profile
-- (there is no natural join key otherwise), and it's safe because today the
-- relationship is exactly 1 profile : 1 tenant. Tenants created after this
-- migration (Phase 2+ signups) get an independent gen_random_uuid().
--
-- Idempotent: safe to re-run, all writes are scoped to still-unmigrated rows.

INSERT INTO "tenants" ("id", "name", "address", "logo_url", "default_signing_place", "created_at", "updated_at")
SELECT
  p."id",
  p."company_name",
  p."address",
  p."logo_url",
  'Lublin',
  p."created_at",
  p."updated_at"
FROM "profiles" p
WHERE p."tenant_id" IS NULL
ON CONFLICT ("id") DO NOTHING;
--> statement-breakpoint

UPDATE "profiles"
SET "tenant_id" = "id"
WHERE "tenant_id" IS NULL;
--> statement-breakpoint

UPDATE "employees" e
SET "tenant_id" = e."employer_id"
WHERE e."tenant_id" IS NULL;
--> statement-breakpoint

UPDATE "templates" t
SET "tenant_id" = t."employer_id"
WHERE t."tenant_id" IS NULL;
--> statement-breakpoint

UPDATE "documents" d
SET "tenant_id" = d."employer_id"
WHERE d."tenant_id" IS NULL;
--> statement-breakpoint

UPDATE "audit_logs" al
SET "tenant_id" = d."tenant_id"
FROM "documents" d
WHERE al."document_id" = d."id"
  AND al."tenant_id" IS NULL;
