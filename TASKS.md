# Current Sprint

## MVP

- [x] Setup project

- [x] Configure Supabase

- [x] Configure Drizzle

- [x] Authentication (email/password sign up + sign in, password reset, TOTP 2FA)

- [x] Dashboard (real stats + recent activity)

- [x] Employee CRUD

- [x] Template CRUD

- [x] PDF Generator

- [x] Signature Canvas

- [x] Email Service

- [x] Audit Log

- [x] QR Verification

- [x] Settings

Full MVP checklist complete as of this sprint (phases 1-11 below). Remaining work is genuinely open-ended product iteration, not a fixed backlog — see "Possible follow-ups" at the bottom.

---

## Completed: Employee CRUD

Delivered

Create

Edit

Delete (soft delete via deletedAt)

Search (name/email)

Pagination

Validation (Zod schema, enforced client + server side)

Company isolation (every query/mutation scoped to the signed-in employer's profile id, derived from the session — never from client input)

Responsive (Tailwind + shadcn/ui)

Files

features/employees/ (schema, actions, components)

app/dashboard/employees/ (list, new, edit routes)

Setup notes

The project only had planning docs (PROJECT.md, ARCHITECTURE.md, TASKS.md) with no actual code, despite this file marking Setup/Supabase/Drizzle as done. Scaffolded the real Next.js 15 App Router project, shadcn/ui, Supabase client/server/middleware, and a Drizzle schema covering every table in ARCHITECTURE.md (profiles, employees, templates, documents, signatures, audit_logs).

Initial migration generated at drizzle/migrations/0000_talented_sphinx.sql. Not yet applied to a database.

Added email/password sign up (app/signup) and sign in (app/login), plus an authenticated dashboard shell, since Employee CRUD requires a real signed-in employer for company isolation. Google OAuth was considered but dropped in favor of Supabase's free built-in email/password auth — no external provider needed. Sign up collects a company name (stored in user_metadata, copied into profiles.companyName on first login) and uses Supabase's default email confirmation flow via app/auth/callback. Full Authentication (password reset, 2FA) and Dashboard (home page content) remain separate open tasks.

Before running locally

1. Create a Supabase project.
2. Fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, DATABASE_URL in .env.local (DATABASE_URL needs the DB password URL-encoded, e.g. `#` becomes `%23`).
3. Run `npm run db:push` to create tables (or `npm run db:generate` + apply the migration manually).
4. Visit /signup to create an employer account, confirm via the email Supabase sends, then sign in at /login. A profiles row is auto-created on first login.

---

## Completed: Employee Data Fields Expansion (Phase 1 of full-scope build-out)

The user supplied their previous product's source (`app/src/`, a legacy CRA app for a logistics employer) as reference material, asking for the employee form and PDF/contract generator to be rebuilt from it, then for the rest of TASKS.md to be completed end-to-end. Full scope is being delivered in 11 sequential phases (see plan); this entry covers phase 1.

Research findings that shaped this phase (kept here since they're not visible from the code alone)

The legacy app actually contains two employee-form implementations: the simple `EmployeeData.jsx` (which the user named) and a newer, more "complete" 8-section `FormWizard.jsx` + Zustand store. The FormWizard was found to be internally broken — its Zod schemas and its rendered field names disagree for 6 of its 8 sections (e.g. the `eyeColor` schema enum can never match what the UI actually submits) — and it persists PESEL/IBAN/passport unredacted to `sessionStorage`. Built this phase from `EmployeeData.jsx`'s field set instead, since it's coherent and the user named it explicitly.

Delivered

Extended `employees` table: passport number, PESEL (with real checksum validation), nationality, address, bank name + IBAN (mod-97 validated), job description, end date, hourly rate, min hours/week, accommodation cost, foreigner status (citizenship, document type/number/expiry, work basis), student flag. PESEL/IBAN validators are direct ports of the two correct helper functions found in the legacy (mismatched) Zod schema file.

Employee form split into composed sub-components per the 100-150 line rule: `personal-info-fields.tsx`, `banking-fields.tsx`, `employment-fields.tsx`, `foreigner-status-fields.tsx`, orchestrated by `employee-form.tsx`. Foreigner fields are revealed only when "foreign national" is checked (progressive disclosure, matching the legacy UX).

Added shadcn `checkbox`/`select`/`textarea` components (this project's shadcn variant wraps `@base-ui/react`, already a dependency — no new packages needed).

No employer-side GDPR-consent checkbox was added to this form: the employer is entering their own employee's data under contract necessity (GDPR Art. 6.1.b), not the data subject's own consent flow. Real GDPR consent capture belongs to the employee-facing signing flow (phase 5), which is where it will be built.

Migration generated at `drizzle/migrations/0001_happy_mephisto.sql` (additive only — nullable columns + two `NOT NULL DEFAULT false` booleans, safe against existing rows). Not yet applied, consistent with migration 0000's status — run `npm run db:push` when ready.

Files

`drizzle/schema.ts` (employees table)

`features/employees/schema.ts`, `features/employees/actions.ts`

`features/employees/components/` (form split into 5 files)

`app/dashboard/employees/[id]/edit/page.tsx` (passes new fields as defaultValues)

---

## Completed: Phase 2 — Company Branding Settings

Extended `profiles` with nullable `address`, `taxId`, `regon`, `krs`, `logoUrl` — the legacy app hardcoded these as a single company's constants (`Polixnov Logistics`); for a multi-tenant SaaS they need to be real per-employer settings so the document letterhead (phase 4) renders correctly for any employer.

Delivered

`features/settings/` (schema, actions, `company-settings-form.tsx`) and `/dashboard/settings` route. Logo is a pasted URL for now, not a file upload — Supabase Storage upload UI is deferred to the storage-bucket work already scoped for phase 4/6.

Migration `drizzle/migrations/0002_lonely_switch.sql` (additive, all nullable columns). Not yet applied.

---

## Completed: Phase 3 — Template CRUD

Simple employer-authored `{{placeholder}}` text templates — list/search/paginate/create/edit/delete, mirroring the Employee CRUD pattern. `placeholders` (jsonb) is derived automatically server-side from the content on every save via regex extraction, not user-entered.

While building this, noticed `EmployeeSearch`/`EmployeePagination` were 100% generic (pure URL-param components with no employee-specific logic) — extracted them to `components/shared/query-search.tsx` and `query-pagination.tsx` and switched both Employees and Templates to the shared versions instead of duplicating, per the "never create duplicate logic" rule.

Files

`features/templates/` (schema, actions, components), `types/template.ts`

`app/dashboard/templates/` (list, new, edit routes)

`components/shared/query-search.tsx`, `components/shared/query-pagination.tsx`

---

## Completed: Phase 4 — PDF Generator / Contract Builder

Direct TypeScript port of the legacy `documentGenerator.js` (the real content engine behind `ContractBuilder.jsx` — the file itself only orchestrated a wizard UI). All 15 document generators ported verbatim (umowa zlecenie + 7 annexes, umowa o pracę + 6 annexes, foreigner checklist), preserving the exact branching logic (contract type, then foreigner checklist appended conditionally) and the real Polish legal clause text, verified section-by-section against the original during rendering.

Rendering was rebuilt on pdf-lib (the CLAUDE.md-mandated stack; legacy used jsPDF) using the actual Poppins TTF files found in the legacy source (not the base64 copies) via `@pdf-lib/fontkit`, so Polish diacritics render correctly. Found and fixed one bug during verification: pdf-lib's y-axis increases upward from the page bottom (opposite of jsPDF/DOM conventions) — the initial cursor position was wrong and produced a 58-page document where 3 pages were expected, one line per page. Fixed and re-verified by generating and visually inspecting real PDFs for both contract branches.

Company letterhead now reads from the per-employer `profiles` branding fields (phase 2) instead of the legacy's hardcoded "Polixnov Logistics" — same renderer serves any employer.

Scope trim (per the plan): `POAForm.jsx`, `ServiceAgreementGenerator.jsx`, and `Form.jsx` (biographical questionnaire) were not ported — they're separate, never-wired-up generators in the legacy app. Adding them later is a matter of one more `lib/documents/generators/*.ts` file each; the plumbing (schema, renderer, storage, UI) already supports it.

Delivered

`lib/legal/` (statutory constants, 8 job positions, 16 wojewoda offices)

`lib/documents/` (types, helpers, 15 generators across 5 files, `generate-bundle.ts` orchestrator)

`lib/pdf/` (pdf-lib renderer + word-wrap layout helper + bundled Poppins fonts)

`features/documents/` (contract builder form, bundle list + download button, actions)

`documents` table: `templateId` now nullable, added `title`, `kind`, `bundleId` (migration `0003_spicy_ego.sql`, not yet applied)

`scripts/setup-storage.ts` — one-off script to create the `documents`/`signatures`/`logos`/`audit` Storage buckets with owner-scoped RLS (run once per environment: `npx tsx scripts/setup-storage.ts`)

New route: `/dashboard/employees/[id]/documents`

New dependencies: `pdf-lib`, `@pdf-lib/fontkit`

---

## Completed: Phase 5 — Signature Canvas + Employee Signing Flow

Implemented the full PROJECT.md signing workflow using the existing `document_status` enum exactly as designed (draft → waiting → employee_signed → completed): documents needing only an employee signature go straight to `waiting` with a secure random `signingToken` at generation time; employer-only documents stay `draft` until signed from the dashboard; two-party documents require both.

Key design choice: rather than overlaying a signature onto the original rendered PDF's exact coordinates (which the renderer doesn't expose), each signature **appends a certificate page** (signer name, timestamp, IP address, consent text, signature image) to the existing PDF. Simpler, robust, and a pattern real e-signature products use.

Security-relevant split: `features/documents/actions.ts` (authenticated employer actions) vs. `features/documents/signing-actions.ts` (public, token-authenticated, no session) — kept in separate files specifically so it's obvious at a glance which code path must never assume a logged-in user. The public flow needs to read/write Storage without an employer session, so it uses a new service-role client (`lib/supabase/service.ts`) instead of the cookie-based one — authorization is enforced by validating the signing token against a `waiting`-status document before any storage operation, not by RLS. **Requires a new env var, `SUPABASE_SERVICE_ROLE_KEY`** (Supabase dashboard → Project Settings → API), added to `.env.local.example`; not yet in `.env.local`.

Verified end-to-end outside the browser: generated a real PDF, appended a signature page to it, confirmed correct page count and layout.

Delivered

`react-signature-canvas` signature pad (`features/documents/components/signature-pad.tsx`), reused by both the public sign form and the in-dashboard employer-sign dialog

`app/sign/[token]/page.tsx` — public, no-login signing page (outside `/dashboard`, so the existing auth middleware doesn't touch it)

`lib/pdf/append-signature.ts`, `lib/supabase/service.ts`

`documents` table: added `signatureType`, `signingToken` (migration `0004_true_moon_knight.sql`, not yet applied)

---

## Completed: Phase 6 — Email Service

Brevo SMTP relay via nodemailer (`smtp-relay.brevo.com:587`). Confirmed `.env.local`'s existing `SMTP_KEY` is the Brevo SMTP password, not a full credential set — it needs a companion `SMTP_LOGIN` (Brevo account email) plus `SMTP_FROM_EMAIL`/`SMTP_FROM_NAME`, added to `.env.local.example`. **Not yet in `.env.local`** — email sends will fail (logged, not thrown) until added.

Wired into every place the workflow needs it: generating a bundle emails the employee one summary invitation listing every document that needs their signature (instead of the employer manually copying links); an employee signing a two-party document emails the employer that it's their turn; final completion emails the employee. The app's own origin is derived from request headers (`lib/get-app-origin.ts`) rather than a hardcoded site-url env var, so links work correctly in any environment without extra config.

Failure isolation: `sendEmail()` catches and logs rather than throwing, so a missing/misconfigured mailer never breaks document generation or signing — those are the features that matter; email is a notification on top.

Delivered

`lib/email/` (client, send, templates)

`.env.local.example` updated with `SMTP_LOGIN`, `SMTP_FROM_EMAIL`, `SMTP_FROM_NAME`

---

## Completed: Phase 7 — Audit Log

`lib/audit/log.ts` — a single `logAuditEvent()` helper (never throws; a logging failure shouldn't fail the action it's recording) — threaded through every mutating action built so far: employee create/update/delete, template create/update/delete, document generation (one entry per generated document), and every signing-flow transition (employee signs, employer signs, completed). Uses the existing `audit_logs` table as designed, no schema changes needed.

Added an "Activity" section to the employee documents page showing the audit trail for that employee's documents (joins `audit_logs` on `documents.employeeId`, scoped to the employer). Employee/template CRUD events aren't tied to a document so they don't appear there — a full cross-entity activity feed is a natural fit for the Dashboard (phase 11) instead.

Delivered

`lib/audit/log.ts`

`features/documents/components/audit-trail.tsx`, `listDocumentAuditLog` query

---

## Completed: Phase 8 — QR Verification

`lib/pdf/embed-verification-qr.ts` draws a QR code (pointing to `/verify/{documentId}`) onto the last page of every document at the moment it becomes truly final: documents needing no signature get it at generation time (they're already final), single-signature documents get it right after the employee signs, two-party documents get it only after the employer's signature completes them (embedding it earlier would point at a not-yet-final PDF). Needed the document's own id before it existed in the DB, so `generateContractBundle` now generates the id client-side (`randomUUID()`) and passes it explicitly into the insert rather than relying on the column default — lets the QR be embedded in the same pass that renders the PDF.

Public `app/verify/[documentId]/page.tsx` shows only title, issuing company, status, and signature dates — no PII (no employee name, PESEL, address, etc.), matching ARCHITECTURE.md's verification design.

Verified end-to-end outside the browser: generated a QR-embedded PDF and visually confirmed the code and caption render correctly on the page.

Delivered

`lib/pdf/embed-verification-qr.ts`

`features/documents/verify-actions.ts`, `app/verify/[documentId]/page.tsx`

New dependency: `qrcode`

---

## Completed: Phase 9 — Settings (rest)

Added the two things actually worth having here: a `notifyOnSignatureNeeded` preference (`profiles` table) gating the "your turn to sign" email from phase 6 — an employer can turn it off without losing the core notification wired earlier — and a read-only "Statutory minimums" card surfacing the `LEGAL_2026` constants the Contract Builder defaults to, so the employer can see what's baked in without reading source code.

Deliberately did not port the legacy app's theme/language/feature-flag settings (English-only UI decision from the plan stands).

Delivered

`profiles.notifyOnSignatureNeeded` (migration `0005_rainy_bloodstrike.sql`, not yet applied)

Settings page: notification checkbox + statutory-minimums info card

---

## Completed: Phase 10 — Auth Hardening

Password reset via Supabase's native flow, reusing the existing `/auth/callback` PKCE code-exchange route (it already handled sign-up confirmation; `resetPasswordForEmail`'s recovery link works the same way — just added `?next=/reset-password`). `requestPasswordReset` always returns success regardless of whether the email exists, to avoid leaking account existence.

TOTP 2FA via Supabase's native MFA API (no new dependency): enrollment lives in Settings (QR code is server-generated SVG markup from Supabase itself, not user input, so `dangerouslySetInnerHTML` is safe there). The login-time challenge is the part that took care: `signIn` now checks `getAuthenticatorAssuranceLevel()` after password auth succeeds, and if a verified TOTP factor exists and the session is still only `aal1`, returns `mfaRequired: true` instead of completing sign-in — the login form then swaps to a 6-digit code step before redirecting to the dashboard.

Delivered

`features/auth/actions.ts` (password reset, MFA challenge), `features/auth/mfa-actions.ts` (enrollment)

`app/forgot-password/`, `app/reset-password/` routes

`features/auth/components/` (forgot/reset password forms, MFA settings, login form rewritten with the 2FA step)

Settings page: two-factor authentication section

---

## Completed: Phase 11 — Dashboard (final phase)

Replaced the placeholder dashboard with real numbers: `features/dashboard/actions.ts` runs Drizzle aggregate queries (employee count, template count, documents grouped by status, 10 most recent audit-log entries) scoped to the signed-in employer — no mocked data, unlike the legacy `AdminDashboard.jsx` this was modeled after. Reused `AuditTrail` (built in phase 7) for the recent-activity list instead of writing a second version.

Delivered

`features/dashboard/` (actions, `stat-card.tsx`)

`app/dashboard/page.tsx` rewritten

---

## Roadmap status: all 11 phases complete

Every item in the original MVP checklist is now built: Employee CRUD (with the full `EmployeeData.jsx` field set), Template CRUD, PDF Generator/Contract Builder (ported from `documentGenerator.js`), Signature Canvas + signing flow, Email Service, Audit Log, QR Verification, Settings, Auth hardening, and a real Dashboard. See the plan file for the full architecture record.

### Before this runs against a live database

1. Apply the pending migrations (`0001`-`0005`, all additive/nullable): `npm run db:push`.
2. Add the new required env vars to `.env.local` (see `.env.local.example`): `SUPABASE_SERVICE_ROLE_KEY`, `SMTP_LOGIN`, `SMTP_FROM_EMAIL`, `SMTP_FROM_NAME`.
3. Run `npx tsx scripts/setup-storage.ts` once to create the `documents`/`signatures`/`logos`/`audit` Storage buckets with owner-scoped RLS.
4. Manually exercise the golden path in a browser (create employee → generate a zlecenie bundle → download/inspect a PDF → sign as employee via the emailed/copied link → sign as employer if two-party → verify via the QR link) — everything above was verified with real PDF generation and typecheck/lint/build, but not yet click-tested end-to-end in a running browser against a live Supabase project.

### Possible follow-ups (not required, not scoped)

- Port the three legacy document generators left out of phase 4 (Power of Attorney, Service Agreement, biographical Questionnaire) — same generator + renderer pattern, just new files.
- Reminder emails for documents stuck in `waiting` past some threshold.
- File-upload logo instead of a pasted URL.
- Bilingual (PL/EN) UI, if ever needed beyond the already-Polish generated documents.

---

## Verified Document Management SaaS build-out

eSignee is evolving from an HR document generator into a Verified Document Management SaaS: a dedicated Documents module, a richer dashboard, selectable bundle generation, categories, immutable version history, a full timeline, a stronger audit report, public verification, company branding, expiry tracking, and reporting. Given the size (roughly matching the entire 11-phase MVP build above), this is being delivered one phase at a time, checkpointed with the user after each, in the priority order the user specified.

### Completed: Phase 12 — Documents Module

The first and highest-priority phase: a dedicated, cross-employee Documents module — previously there was no document detail page and no global list, only an inline per-employee grouped list (`document-bundle-list.tsx`).

Schema (migration `0008_absent_alice.sql`, additive, applied to the dev database): `documents` gained `deletedAt` (soft delete/restore), `category` (new `document_category` enum: hr/legal/finance/operations/sales/custom, defaulting to `hr` — full category management UI is a later phase, but the column ships now to avoid a second migration touching these rows twice), `customCategoryLabel`, `sha256Hash`, and `currentVersion` (starts at 0; `recordDocumentVersion` always increments, so the first recorded version becomes 1 — caught this off-by-one via a real browser smoke test where a freshly generated document showed "v2" instead of "v1"). New `document_versions` table stores an immutable snapshot (version number, storage path, SHA-256, note, actor, timestamp) every time a document's PDF changes — generation, employee signs, employer signs, completion — reusing the PDF bytes already being uploaded at each of those existing steps rather than re-uploading. `signatures` gained `userAgent` for the Audit Report's "Browser" field.

Services, per the technical requirements — extended existing ones rather than wrapping them redundantly:
- **DocumentService** (`lib/documents/document-service.ts`, genuinely new): `recordDocumentVersion`, `listDocumentVersions`.
- **VerificationService** (`lib/documents/verification-service.ts`, new): expanded `getVerificationInfo` (category, version, hash, verification count) and logs a `document.verified` audit event on every lookup; `features/documents/verify-actions.ts` is now a thin wrapper over it.
- **AuditService**: `lib/audit/log.ts` already filled this role — extended with `listDocumentTimeline`, `countDocumentVerifications`, and a new shared `lib/audit/action-labels.ts` so `audit-trail.tsx` and the new `document-timeline.tsx` stop maintaining separate label maps.
- **PdfService**: `lib/pdf/*` already filled this role — added one small `lib/pdf/hash.ts` (SHA-256 via Node's built-in `crypto`).
- **EmailService**: reused `lib/email/*` from phase 6 as-is for Send Again.

Delivered, per document: Preview (dialog with a signed-URL iframe), Download, Soft Delete/Restore (blocked from the public sign flow once deleted), Timeline (vertical, reusing the audit log with an expanded action vocabulary — `document.sent`, `.viewed`, `.consent_accepted`, `.downloaded`, `.deleted`, `.restored`, alongside the existing generate/sign/complete events), Version History (table with per-version SHA-256 and download), Audit Report (hash, version, category, verification count, QR thumbnail reusing the existing `embed-verification-qr.ts` QR generation, signer IP/browser, email-sent history), and Send Again (re-sends the existing invitation/reminder email to whichever party's turn it is, reusing the existing signing token — no new link issued).

Files: `app/dashboard/documents/[id]/page.tsx` (new detail page with `Tabs`), `features/documents/components/document-{preview-dialog,delete-restore-button,timeline,versions,audit-report,filters}.tsx` + `resend-signing-email-button.tsx` + `download-version-button.tsx` (new), `document-table.tsx`/`document-bundle-list.tsx`/`audit-trail.tsx` (updated to link into the new detail page and share the action-label map), `app/dashboard/documents/page.tsx` (status/category filters added to the existing global list).

Verified end-to-end in a real browser against a live (test) Supabase project — not just typecheck/build: created a fully-confirmed test employer via the Supabase admin API, drove the whole flow with Playwright (login → create employee → create template → generate a document → see it in the global list → open the detail page → Timeline shows "Generated" → Versions shows v1 → Audit Report renders hash/QR/verification count → Preview opens → Soft Delete hides it from the list → Restore brings it back), then hit the public `/verify/{id}` page directly and confirmed the `document.verified` event landed in the timeline with a null actor (correctly anonymous). All test data and uploaded test files were deleted afterward.

### Completed: Phase 13 — Dashboard Improvements

Second priority: KPI cards, a monthly document chart, a document-status pie chart, and a recent-documents widget, added to the existing dashboard (which already had stat cards, an expiry tracker, and a recent-activity feed from phase 11 — extended rather than rebuilt).

KPI row grew from 4 to 6 cards: kept Employees/Templates/Awaiting signature/Completed, added **Total documents** and **Completion rate** (both derived from data `getDashboardStats` already returns — no new query).

Two new read-only queries in `features/dashboard/actions.ts`: `getMonthlyDocumentCounts` (documents grouped by `to_char(created_at, 'YYYY-MM')`, zero-filled for the last 6 months so the chart never has gaps). "Recent documents" reuses the existing `listDocuments` from `features/documents/actions.ts` (phase 12) rather than writing a near-duplicate query — just takes the first 5 of page 1.

Charts are hand-rolled inline SVG, not a charting library (`MonthlyDocumentsChart`, `DocumentStatusPieChart`) — per CLAUDE.md's "never use unnecessary libraries," and the dataviz skill's method was followed rather than eyeballed: the 5 document-status colors are the skill's validated categorical palette (ran `scripts/validate_palette.js`, all checks pass — CVD ΔE 24.2, well clear of the ≥12 target), assigned in fixed order (draft/waiting/employee_signed/completed/archived → blue/aqua/yellow/green/violet) and never reassigned per-value. New shared `DOCUMENT_STATUS_COLORS`/`DOCUMENT_STATUS_ORDER` constants live in `lib/documents/status-labels.ts` alongside the existing label map. Both charts render as plain SVG from a Server Component — no client JS, no new dependency — using native `<title>` elements for hover tooltips instead of a JS tooltip layer.

Caught two real polish bugs via an actual browser screenshot (not just code review), matching the skill's "render it and look at it" step: the pie chart's legend was clipping long labels ("Awaiting employee signa…") — fixed by dropping the truncating width constraint and letting labels wrap; and the bar chart's y-axis showed an ugly midpoint tick (0/3/5, from `Math.round(2.5)`) — fixed `niceMax` to always return an even number so the midpoint is a clean integer (0/2/4).

Files: `features/dashboard/components/monthly-documents-chart.tsx`, `document-status-pie-chart.tsx`, `recent-documents.tsx` (new); `features/dashboard/actions.ts` (`getMonthlyDocumentCounts`); `lib/documents/status-labels.ts` (`DOCUMENT_STATUS_COLORS`, `DOCUMENT_STATUS_ORDER`); `app/dashboard/page.tsx` (rewired layout).

Verified in a real browser: seeded a disposable test employer (via the Supabase admin API) with 14 documents spread across 6 months and all 5 statuses, screenshotted the live dashboard, confirmed the KPI numbers/pipeline counts/chart totals all agree (14 total, 3/3/2/4/2 by status), and confirmed zero console errors. Test data deleted afterward.

### Completed: Phase 14 — Bundle Generation (selectable templates, single signing session)

Third priority: replaced the "pick one template at a time" generator with a checkbox multi-select, and introduced a real **signing session** concept so an employee who owes signatures on several documents gets one link, not one email per document.

**Signing session mechanism** (the significant part): `documents.signingToken` was `unique()` — one token, one document. Dropped that constraint (migration `0009_thin_purple_man.sql`, a single `DROP CONSTRAINT`) so every document generated in one batch that needs an employee signature can share one token. `persistGeneratedDocument` (shared by both generation flows) no longer generates its own token — the caller now decides: Contract Builder still passes a fresh `randomUUID()` per document (unchanged behavior), while the new template flow generates **one** token up front and passes it to every document in the batch.

This meant the public sign flow (`features/documents/signing-actions.ts`) had to stop assuming "one token → one document": `getDocumentBySigningToken` (returned one row) became `getSigningSession` (returns every row sharing the token — an array, naturally length-1 for existing Contract Builder links, so **one code path serves both** instead of forking the logic). `submitEmployeeSignature` now loops the session: one drawn signature, one consent acceptance, applied to each document in turn — each still gets its own PDF, its own `signatures` row, its own timeline events, and its own version bump, exactly as before, just looped instead of singular. `app/sign/[token]/page.tsx` now renders a list of 1..N documents (title + preview link each) instead of assuming one.

**Checkbox UI**: `generate-from-template-form.tsx` replaced its single-template `Select` with a checkbox list (`features/templates` unchanged). Placeholders are now a shared value map keyed by name across every checked template — a `{{employee_name}}` used in two templates is filled once, not twice. New `generateDocumentsFromTemplates` action (replacing `generateDocumentFromTemplate`) validates every checked template belongs to the employer, generates only the checked ones, and sends one invitation email covering the whole batch.

Files: `drizzle/schema.ts` + migration `0009` (signingToken no longer unique); `features/documents/schema.ts` (`generateFromTemplatesSchema`); `features/documents/actions.ts` (`generateDocumentsFromTemplates`, `persistGeneratedDocument` takes a caller-supplied token); `features/documents/signing-actions.ts` (`getSigningSession`, `getSigningSessionPreviewUrls`, session-looping `submitEmployeeSignature`); `app/sign/[token]/page.tsx`; `generate-from-template-form.tsx`.

Deliberately out of scope: Contract Builder's own multi-document generation still sends one link per document rather than adopting the new shared-session mechanism — its current behavior isn't broken and wasn't part of this ask; noted below as a natural follow-up now that the mechanism exists.

Verified in a real browser end-to-end: created two templates sharing a placeholder, checked both, generated with one submit, confirmed both "Copy signing link" buttons on the dashboard yield the **identical** URL, opened that link in a fresh (unauthenticated) context, confirmed the page read "2 documents to sign" with two separate previews, drew one signature, accepted consent once, submitted once — confirmed via direct DB query that both documents independently reached `completed` with their own signature row (same signer, same IP/UA, same underlying signature image file) and full, correct timelines (generated → sent → viewed → consent_accepted → signed_by_employee → completed) on each. All test data and storage files deleted afterward.

### Completed: Phase 15 — Document Categories

Fourth priority. Phase 12 had already added the `category`/`customCategoryLabel` columns and a documents-list filter, but there was no way to actually *choose* a category anywhere — everything silently defaulted to `hr`. This phase closes that gap: templates now carry a category, generated documents inherit it, and a document can be reclassified after the fact.

**Templates get a category** (migration `0010_early_wild_pack.sql`, additive: `templates.category` default `hr`, `templates.customCategoryLabel`). `template-form.tsx` gained a category `Select` with the same progressive-disclosure pattern already used elsewhere in the app (a free-text label input appears only when "Custom" is picked). The templates list gained a category column and a filter, reusing the same `QuerySelectFilter` introduced below.

**Inheritance, not re-selection**: `generateDocumentsFromTemplates` (phase 14) now passes each template's own `category`/`customCategoryLabel` through `persistGeneratedDocument` — a generated document's category comes from its source template automatically. Contract Builder is untouched and keeps defaulting to `hr` (unchanged — these are inherently HR/employment documents; forcing a category picker onto that flow would be speculative).

**Correction capability**: new `updateDocumentCategory` action plus `DocumentCategoryEditor`, replacing the read-only category badge on the document detail page with an editable one — an employer can reclassify a document after generation without touching its template.

**Dedupe**: `document-filters.tsx`'s category `Select` and the new templates-list filter were both about to duplicate the same "Select bound to a URL param" logic, so extracted `components/shared/query-select-filter.tsx` once and had both pages compose it.

**Found and fixed a real, previously-unnoticed bug** while building this: shadcn's `Select` (`components/ui/select.tsx`, wrapping `@base-ui/react/select`) resolves its closed-trigger label by reading the matching `Select.Item`'s rendered children — but those live in a portal that hasn't mounted before the user's first click, so on initial page load every select in the app was showing the raw enum *value* ("hr", "all") instead of its label ("HR", "All categories") until clicked once. Fixed it in the three selects this phase touches (`QuerySelectFilter`, `DocumentCategoryEditor`, the template form's category select) using `Select.Value`'s `children`-as-function prop, which resolves the label directly instead of relying on portal content. Caught via an actual screenshot showing "all" in the filter trigger, not by reading the code. **Not fixed elsewhere** (contract type, signature type, position pickers, etc. still have the same latent bug) — out of scope for a categories phase; flagged here as a worthwhile follow-up.

Files: `drizzle/schema.ts` + migration `0010`; `lib/documents/category-labels.ts` (`DOCUMENT_CATEGORIES`, `DocumentCategory` type); `features/templates/schema.ts` + `actions.ts` (category CRUD/filtering); `template-form.tsx`, `template-table.tsx`, `app/dashboard/templates/page.tsx`; `features/documents/actions.ts` (`updateDocumentCategory`, category inheritance in `generateDocumentsFromTemplates`); `document-category-editor.tsx` (new); `components/shared/query-select-filter.tsx` (new, shared).

Verified in a real browser: created a Legal-category template and a Custom-category template (labeled "Onboarding Kit"), confirmed both badges render correctly (not the literal word "Custom"), filtered the templates list down to Legal-only, generated a document from the Legal template and confirmed it inherited "Legal" on the global documents list, then reclassified it to "Finance" via the detail-page editor and confirmed the change survived a page reload. Zero console errors throughout. Test data deleted afterward.

### Remaining phases (not yet started)

Category-based reporting (the filtering/searching half of this phase's original ask is done; aggregate reporting is bundled with the Reporting phase below), version *compare*, public verify page redesign (Authentic/Invalid, timeline summary), company branding (logo upload, colors, footer, signature block applied to PDFs/emails/verification), expiry tracking UI (effective/renewal dates, 7/30-day dashboard alerts), and the reporting suite (completion rate, average signing time, most-used templates, monthly trends). Possible follow-ups: migrate Contract Builder's multi-document generation onto the shared-session mechanism from phase 14 so it also sends one signing link instead of one per document; apply the same `Select.Value` children-function fix to the app's other selects (contract type, signature type, position picker).
