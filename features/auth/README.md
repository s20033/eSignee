# Auth

Phase 2a (employee accounts): adds the employee self-registration path
alongside the existing tenant_admin sign-up. `registerEmployee` resolves a
`/join/{code}` invite code to a tenant, creates the Supabase Auth user, and
inserts the `profiles` row directly (`role: employee, status: pending`) —
unlike `getCurrentProfile()`'s lazy auto-create for tenant_admins, this
never creates a tenant.

`registerEmployeeSchema` reuses `features/employees/schema.ts::employeeFormSchema`
(the same fields a tenant_admin would fill in) rather than just name/email —
`registerEmployee` creates the full `employees` row immediately, with
`toEmployeeInsertValues` shared with `features/employees/actions.ts`, so a
tenant_admin reviewing a request (`/dashboard/approvals/[id]`) sees real
submitted data, not a blank record. It stays hidden from the regular
Employees list until approved.
