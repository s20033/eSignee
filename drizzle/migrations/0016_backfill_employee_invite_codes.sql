-- Generates an 8-character uppercase invite code for every tenant that
-- doesn't have one yet (pre-Phase-2 tenants). New tenants set their own code
-- at creation time (see lib/auth/get-current-profile.ts), so this only ever
-- needs to run once against historical rows. Idempotent.
UPDATE "tenants"
SET "employee_invite_code" = upper(substr(md5(random()::text || clock_timestamp()::text || "id"::text), 1, 8))
WHERE "employee_invite_code" IS NULL;
