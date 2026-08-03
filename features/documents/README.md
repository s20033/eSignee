# Documents

Phase 1 (multi-tenant foundation): every generated `documents` row and audit
log event now also carries `tenantId`, sourced from `getCurrentTenant()`
alongside the existing `employerId` scoping (unchanged). The contract
generators' hardcoded "Lublin" signing place now reads from
`tenants.defaultSigningPlace` — see `lib/documents/types.ts`'s
`EmployerData.signingPlace`.

Phase 3 (dynamic document engine): both generation actions
(`generateContractBundle`, `generateDocumentsFromTemplates`) now also fetch
`tenant_document_settings` and pass `signatoryName`/`signatoryTitle` through
`EmployerData` — see `lib/pdf/chrome.ts`'s `drawSignatureBlock` and
`lib/documents/helpers.ts`'s `representedByClause`. Falls back to the
company name / generic phrasing exactly as before when unset.

Employee-initiated uploads (`features/document-uploads`) create ordinary
`documents` rows (`kind: "employee_uploaded"`, `signatureType: "employer"`)
that need no changes here — the existing document list, detail page, and
`signAsEmployer`/`SignAsEmployerDialog` already handle any document
regardless of how it was created.
