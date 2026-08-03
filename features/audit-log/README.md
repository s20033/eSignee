# Audit log

New in Phase 4. The full tenant-wide, paginated audit trail
(`/dashboard/audit-log`) — every event ever logged via `logAuditEvent`,
not just document-linked ones. This is distinct from two things that
already existed and are unchanged:

- The dashboard home's "Recent activity" widget (`getDashboardStats`) —
  capped at 10 rows and only shows document-linked events
  (`innerJoin(documents)`), by design, as a quick glance.
- `listDocumentTimeline` — one document's own history, used by the
  document detail page's Timeline/Audit Report tabs.

The query itself (`listTenantAuditLog`) lives in `lib/audit/log.ts`
alongside `logAuditEvent`, not here — this feature folder is just the
`getCurrentProfile()`-gated wrapper and the page/table UI.
