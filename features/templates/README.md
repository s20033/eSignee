# Templates

Phase 1 (multi-tenant foundation): template rows now also carry `tenantId`
(from `profile.tenantId`), set at create time alongside the existing
`employerId`. Reads/writes still scope by `employerId`, unchanged.
