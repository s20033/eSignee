/**
 * One-off: applies the Phase 2a (employee self-registration + approval
 * workflow) migrations in order. Same pattern as
 * apply-phase1-tenant-migration.ts — four separate transactions, stops
 * immediately on the first error.
 *
 * Run once per environment: npx tsx scripts/apply-phase2a-employee-accounts.ts
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });

const MIGRATIONS = [
  "0015_employee_accounts_foundation.sql",
  "0016_backfill_employee_invite_codes.sql",
  "0017_tighten_employee_invite_code_not_null.sql",
  "0018_add_profile_full_name.sql",
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

    console.log("\nAll Phase 2a migrations applied successfully.");
  } finally {
    await sql.end();
  }
};

main().catch((error) => {
  console.error("\nMigration failed — stopped before applying later files:", error);
  process.exit(1);
});
