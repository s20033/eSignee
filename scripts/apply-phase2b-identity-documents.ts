/**
 * One-off: applies the Phase 2b (identity documents) migrations in order.
 * Same pattern as apply-phase1-tenant-migration.ts / apply-phase2a-employee-accounts.ts.
 *
 * Run once per environment: npx tsx scripts/apply-phase2b-identity-documents.ts
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });

const MIGRATIONS = ["0019_identity_documents.sql", "0020_identity_documents_rls.sql"] as const;

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

    console.log("\nAll Phase 2b migrations applied successfully.");
  } finally {
    await sql.end();
  }
};

main().catch((error) => {
  console.error("\nMigration failed — stopped before applying later files:", error);
  process.exit(1);
});
