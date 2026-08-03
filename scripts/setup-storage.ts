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

// Path convention: {tenantId}/{employeeId}/{filename}. Unlike the owner-only
// buckets above, this one has two legitimate readers per file — the
// uploading employee, and any tenant_admin in the same tenant — so it can't
// use the simple "auth.uid() = first path segment" pattern. The subqueries
// below rely on employees/profiles' own RLS policies (Phase 1) to already
// scope what each caller can see, so no extra SECURITY DEFINER helper is
// needed. No update/delete policy: a correction is a new upload, not an
// edit, so the review trail (including past rejections) stays intact.
const setupIdentityDocumentsBucket = async (sql: postgres.Sql) => {
  const bucket = "identity-documents";

  await sql`
    insert into storage.buckets (id, name, public)
    values (${bucket}, ${bucket}, false)
    on conflict (id) do nothing
  `;

  await sql.unsafe(`drop policy if exists "identity_documents_insert_own" on storage.objects`);
  await sql.unsafe(`
    create policy "identity_documents_insert_own" on storage.objects for insert
    with check (
      bucket_id = '${bucket}'
      and exists (
        select 1 from employees e
        where e.id::text = (storage.foldername(name))[2]
          and e.tenant_id::text = (storage.foldername(name))[1]
          and e.user_id = auth.uid()
      )
    )
  `);

  await sql.unsafe(`drop policy if exists "identity_documents_select_own_or_admin" on storage.objects`);
  await sql.unsafe(`
    create policy "identity_documents_select_own_or_admin" on storage.objects for select
    using (
      bucket_id = '${bucket}'
      and (
        exists (
          select 1 from employees e
          where e.id::text = (storage.foldername(name))[2]
            and e.tenant_id::text = (storage.foldername(name))[1]
            and e.user_id = auth.uid()
        )
        or exists (
          select 1 from profiles p
          where p.id = auth.uid()
            and p.tenant_id::text = (storage.foldername(name))[1]
            and p.role = 'tenant_admin'
        )
      )
    )
  `);

  console.log(`Configured bucket "${bucket}" (private, tenant/employee-scoped).`);
};

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

    await setupIdentityDocumentsBucket(sql);
  } finally {
    await sql.end();
  }
};

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
