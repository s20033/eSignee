# Approvals

New in Phase 2a. Tenant Admin queue for reviewing employee self-registrations
(`profiles` rows with `role: employee, status: pending`, created by
`features/auth/actions.ts::registerEmployee`). Rejecting requires a reason,
stores it on `profiles.rejectionReason`, and emails the employee.

Phase 2a update: `registerEmployee` now creates the full `employees` row
up front (not just name/email), so `approveEmployee` is mostly a status
flip — the insert path only runs as a defensive fallback for a request that
somehow has no linked `employees` row yet. `/dashboard/approvals/[id]`
(`getPendingRequestDetail`) shows that full submitted record via the same
`EmployeeSummaryCard` the regular Employees page uses, so an admin isn't
approving blind. Rejecting soft-deletes the `employees` row it created,
matching `deleteEmployee`'s convention.
