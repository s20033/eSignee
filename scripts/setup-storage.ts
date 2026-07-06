/**
 * One-off setup: creates the Supabase Storage buckets this app needs and
 * scopes access so an employer can only read/write objects under a path
 * prefixed with their own profile id (auth.uid()).
 *
 * Run once per environment: npx tsx scripts/setup-storage.ts
 */
import { config } from "dotenv";
import postgres from "postgres";

config({ path: ".env.local" });

const BUCKETS = ["documents", "signatures", "logos", "audit"] as const;

const main = async () => {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error("DATABASE_URL is not set");
  }

  const sql = postgres(databaseUrl, { max: 1 });

  try {
    for (const bucket of BUCKETS) {
      await sql`
        insert into storage.buckets (id, name, public)
        values (${bucket}, ${bucket}, false)
        on conflict (id) do nothing
      `;

      const selectPolicy = `${bucket}_select_own`;
      const insertPolicy = `${bucket}_insert_own`;
      const deletePolicy = `${bucket}_delete_own`;

      await sql.unsafe(`drop policy if exists "${selectPolicy}" on storage.objects`);
      await sql.unsafe(`
        create policy "${selectPolicy}" on storage.objects for select
        using (bucket_id = '${bucket}' and auth.uid()::text = (storage.foldername(name))[1])
      `);

      await sql.unsafe(`drop policy if exists "${insertPolicy}" on storage.objects`);
      await sql.unsafe(`
        create policy "${insertPolicy}" on storage.objects for insert
        with check (bucket_id = '${bucket}' and auth.uid()::text = (storage.foldername(name))[1])
      `);

      await sql.unsafe(`drop policy if exists "${deletePolicy}" on storage.objects`);
      await sql.unsafe(`
        create policy "${deletePolicy}" on storage.objects for delete
        using (bucket_id = '${bucket}' and auth.uid()::text = (storage.foldername(name))[1])
      `);

      console.log(`Configured bucket "${bucket}" (private, owner-scoped by first path segment).`);
    }
  } finally {
    await sql.end();
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
