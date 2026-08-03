# Document uploads

New in Phase 3. The employee-initiated counterpart to employer-generated
documents: an employee uploads an external PDF (2 MB limit, same
client+server re-validation pattern as `features/identity-documents`) that
needs the employer's signature.

Writes into the same `documents` Storage bucket and path convention as
employer-generated documents (`{employerId}/{employeeId}/{bundleId}/{documentId}.pdf`),
but the employee's own session has no RLS access to that path — so this uses
the service-role client (`lib/supabase/service.ts`), following the same
"trusted server-only code path" precedent already established by
`features/documents/signing-actions.ts` for the no-login signing flow.

Deliberately creates a plain `documents` row (`kind: "employee_uploaded"`,
`signatureType: "employer"`, `signatureLayout: null`) rather than a new
table or a parallel review flow — the existing employer dashboard, document
detail page, and `signAsEmployer` action already handle it with zero
changes. `applySignatureToDocument` already tolerates `signatureLayout: null`
(skips the inline stamp, still produces the full evidentiary certificate
page), which is what makes this work without needing to know the layout of
an arbitrary uploaded PDF.
