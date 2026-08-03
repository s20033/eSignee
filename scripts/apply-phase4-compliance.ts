/**
 * One-off: applies the Phase 4 (compliance) migrations in order.
 * Same pattern as the earlier apply-phaseN-*.ts scripts.
 *
 * Run once per environment: npx tsx scripts/apply-phase4-compliance.ts
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });

const MIGRATIONS = [
  "0021_identity_document_reminders.sql",
  "0022_identity_document_reminders_rls.sql",
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

    console.log("\nAll Phase 4 migrations applied successfully.");
  } finally {
    await sql.end();
  }
};

main().catch((error) => {
  console.error("\nMigration failed — stopped before applying later files:", error);
  process.exit(1);
});
