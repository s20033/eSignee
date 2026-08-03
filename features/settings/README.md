# Settings

Phase 1 (multi-tenant foundation): the company settings form now also edits
`tenants.defaultSigningPlace` (previously hardcoded to "Lublin" in the
document generators). `profiles` still owns branding fields
(companyName/address/logoUrl/taxId/regon/krs); `tenants` is updated in
parallel to keep the two in sync.

Phase 2a (employee accounts): adds the employee sign-up link
(`tenants.employeeInviteCode`, shown/regenerated from the Company tab) that
new hires use at `/join/{code}` to self-register.

Phase 3 (dynamic document engine): adds the Signatory form
(`getSignatorySettings`/`updateSignatorySettings`), the first thing to
actually read/write `tenant_document_settings` — that table existed since
Phase 1 but was unused until now. Upserts rather than updates, since no row
exists for a tenant until its admin sets a signatory for the first time.
