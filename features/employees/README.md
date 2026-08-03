# Employees

Phase 1 (multi-tenant foundation): employee rows now also carry `tenantId`
(from `profile.tenantId`), set alongside the existing `employerId` at
create/update time. Reads/writes still scope by `employerId`, unchanged.

Phase 2a (employee accounts): employee rows can now optionally carry
`userId`, linking the HR record to a login account — set by
`features/auth/actions.ts::registerEmployee` at self-registration time.
Employer-created employees (this feature's own create/update actions) still
don't get a login until a future employer-initiated invite flow.

Queries switched from `employerId` to `tenantId` scoping (`listEmployees`,
`getEmployeeById`, `updateEmployee`, `deleteEmployee`) — self-registered
employees' `employerId` is set to "a" tenant_admin found at registration
time, not necessarily whichever admin is currently logged in, so `employerId`
alone is no longer a safe scope once a tenant could have more than one
admin. `employerId` stays on the table for provenance ("who administratively
created this") but no longer gates visibility.

`listEmployees`/`getEmployeeById` also hide any row whose linked profile is
still `status: pending` — see `notPendingSelfRegistration` — so a
self-registered applicant never appears as a real employee before a
tenant_admin approves them.
