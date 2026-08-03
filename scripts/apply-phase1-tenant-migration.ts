/**
 * One-off: applies the Phase 1 multi-tenant foundation migrations in order.
 * Runs 0011 (schema, nullable tenant_id) -> 0012 (backfill) -> 0013 (tighten
 * NOT NULL) -> 0014 (RLS policies) as four separate transactions, stopping
 * immediately on the first error so a failure never leaves tenant_id half
 * backfilled.
 *
 * Run once per environment: npx tsx scripts/apply-phase1-tenant-migration.ts
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });

const MIGRATIONS = [
  "0011_multi_tenant_foundation.sql",
  "0012_backfill_tenant_data.sql",
  "0013_tighten_tenant_id_not_null.sql",
  "0014_tenant_rls_policies.sql",
] as const;

const main = async () => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  const sql = postgres(databaseUrl, { max: 1 });

  try {
    for (const file of MIGRATIONS) {
      const path = join(process.cwd(), "drizzle", "migrations", file);
      const content = readFileSync(path, "utf-8");
      const statements = content
        .split("--> statement-breakpoint")
        .map((s) => s.trim())
        .filter(Boolean);

      console.log(`\n-- ${file} (${statements.length} statement(s)) --`);

      await sql.begin(async (tx) => {
        for (const statement of statements) {
          await tx.unsafe(statement);
        }
      });

      console.log(`  applied.`);
    }

    console.log("\nAll Phase 1 migrations applied successfully.");
  } finally {
    await sql.end();
  }
};

main().catch((error) => {
  console.error("\nMigration failed — stopped before applying later files:", error);
  process.exit(1);
});
