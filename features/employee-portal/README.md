# Employee portal

New in Phase 2b. The `/portal` route tree — the employee-facing counterpart
to `/dashboard`. Uses `lib/auth/get-current-portal-user.ts` instead of
`getCurrentProfile()`; unlike that function, it never auto-creates a
profile, and it renders the pending/rejected account states itself rather
than bouncing an already-logged-in employee back to `/login`. Scoped
entirely to the signed-in employee's own `employees.id` — see
`listMyDocumentBundles`/`getMyDocumentDownloadUrl` here vs. the
tenant_admin-scoped equivalents in `features/documents/actions.ts`.
