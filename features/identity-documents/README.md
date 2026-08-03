# Identity documents

New in Phase 2b. Employee-uploaded ID/passport/work-permit/visa records,
reviewable by the tenant admin. Uploads are capped at 2 MB, enforced both
client-side (`upload-identity-document-form.tsx`, immediate feedback) and
server-side (`uploadIdentityDocument`, the real check — never trust the
client). File storage RLS (`identity-documents` bucket, see
`scripts/setup-storage.ts`) is the actual enforcement for who can read/write
which files — the uploading employee, or a tenant_admin in the same tenant.
The `identity_documents` table's own RLS stays at tenant granularity like
every other table (defense-in-depth only, per Phase 1).

Phase 4 (compliance): adds `listAllIdentityDocuments` (every document
regardless of status, sortable/filterable by expiry — the compliance
dashboard) and `exportIdentityDocumentsCsv`, alongside the existing
`listPendingIdentityDocumentReviews` (pending-only, the review queue —
unchanged). `countExpiringIdentityDocuments` powers the sidebar's
"Compliance" badge (documents expiring within 30 days, excluding rejected).
The actual reminder emails are sent by `app/api/cron/expiry-reminders`, not
from this file — see its own comments for why a Route Handler instead of a
Server Action.
