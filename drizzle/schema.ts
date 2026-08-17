import {
  boolean,
  check,
  date,
  integer,
  jsonb,
  numeric,
  pgEnum,
  pgSchema,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";

const authSchema = pgSchema("auth");

export const authUsers = authSchema.table("users", {
  id: uuid("id").primaryKey(),
});

export const userRoleEnum = pgEnum("user_role", ["super_admin", "tenant_admin", "employee"]);

export const accountStatusEnum = pgEnum("account_status", [
  "pending",
  "active",
  "rejected",
  "disabled",
]);

export const tenantStatusEnum = pgEnum("tenant_status", ["active", "suspended"]);

// One row per employer company. Introduced in the multi-tenant migration —
// every existing profile got a tenant row with the same id (see the
// 00xx_backfill_tenants migration), so tenants.id == the founding admin's
// profiles.id for pre-existing accounts. New signups create both together.
export const tenants = pgTable("tenants", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  address: text("address"),
  logoUrl: text("logo_url"),
  // Place of signing shown in generated contracts and on the PDF signature
  // block (was hardcoded to "Lublin" pre-migration).
  defaultSigningPlace: text("default_signing_place").notNull().default("Lublin"),
  defaultLocale: text("default_locale").notNull().default("pl"),
  // Shared via /join/{code} so a new hire can self-register without a raw
  // tenant id in the URL, and without a "search for your employer" flow that
  // would leak which companies use the product. Regeneratable from Settings.
  employeeInviteCode: text("employee_invite_code").notNull().unique(),
  // Reserved for Phase 5 billing; unused until then.
  plan: text("plan").notNull().default("free"),
  status: tenantStatusEnum("status").notNull().default("active"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

// Tenant-editable document generation settings. Kept minimal for now
// (Phase 3 extends this with clause/letterhead editing); split from
// `tenants` so per-document-generation config doesn't crowd the core
// tenant row.
export const tenantDocumentSettings = pgTable("tenant_document_settings", {
  id: uuid("id").primaryKey().defaultRandom(),
  tenantId: uuid("tenant_id")
    .notNull()
    .unique()
    .references(() => tenants.id, { onDelete: "cascade" }),
  signatoryName: text("signatory_name"),
  signatoryTitle: text("signatory_title"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const profiles = pgTable("profiles", {
  id: uuid("id")
    .primaryKey()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  role: userRoleEnum("role").notNull().default("tenant_admin"),
  status: accountStatusEnum("status").notNull().default("active"),
  email: text("email").notNull(),
  // Person's own name — collected at self-registration for employee
  // profiles (used to seed their `employees` row on approval). Nullable:
  // the tenant_admin signup flow doesn't collect this today.
  fullName: text("full_name"),
  // Only meaningful for tenant_admin profiles (shown on PDF letterheads,
  // settings, dashboard header). Employee profiles get this set to their
  // tenant's name at registration, purely as a harmless fallback — nothing
  // employee-facing reads it; their identity lives on the linked employees
  // row instead. Kept NOT NULL so the many existing tenant_admin call sites
  // don't need a null check for a case that can't happen for them.
  companyName: text("company_name").notNull(),

  // Company branding — used on generated PDF letterheads. Only meaningful
  // for tenant_admin profiles.
  address: text("address"),
  taxId: text("tax_id"),
  regon: text("regon"),
  krs: text("krs"),
  logoUrl: text("logo_url"),

  notifyOnSignatureNeeded: boolean("notify_on_signature_needed").notNull().default(true),
  // Set when a tenant_admin rejects a self-registered employee account —
  // shown to the employee in the rejection email.
  rejectionReason: text("rejection_reason"),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const employees = pgTable("employees", {
  id: uuid("id").primaryKey().defaultRandom(),
  employerId: uuid("employer_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  // Set once this employee has (or gets) portal login access — via
  // self-registration approval or a future employer-initiated invite.
  // Nullable: most existing employee records predate logins and stay
  // record-only. onDelete "set null" (not cascade) so deleting the login
  // account never deletes the HR record itself.
  userId: uuid("user_id")
    .unique()
    .references(() => profiles.id, { onDelete: "set null" }),
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  position: text("position"),
  salary: numeric("salary", { precision: 12, scale: 2 }),
  startDate: date("start_date", { mode: "string" }),

  // Identity
  passportNumber: text("passport_number"),
  pesel: text("pesel"),
  nationality: text("nationality"),
  address: text("address"),

  // Banking
  bankName: text("bank_name"),
  iban: text("iban"),

  // Employment specifics
  jobDescription: text("job_description"),
  endDate: date("end_date", { mode: "string" }),
  hourlyRate: numeric("hourly_rate", { precision: 10, scale: 2 }),
  minHoursPerWeek: numeric("min_hours_per_week", { precision: 5, scale: 1 }),
  accommodationCost: numeric("accommodation_cost", { precision: 10, scale: 2 }),

  // Foreigner / student status
  isForeigner: boolean("is_foreigner").notNull().default(false),
  citizenship: text("citizenship"),
  foreignerDocumentType: text("foreigner_document_type"),
  foreignerDocumentNumber: text("foreigner_document_number"),
  foreignerDocumentExpiry: date("foreigner_document_expiry", { mode: "string" }),
  workBasis: text("work_basis"),
  isStudent: boolean("is_student").notNull().default(false),

  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

// Lightweight reusable contact for an external (non-employee) signer — a company
// or individual outside the tenant's own workforce. Deliberately minimal, unlike
// `employees`: no salary/PESEL/banking/employment fields, just enough to send and
// re-send documents to the same counterparty.
export const signees = pgTable("signees", {
  id: uuid("id").primaryKey().defaultRandom(),
  employerId: uuid("employer_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  // Person's name, or the signing individual's name when representing a company
  // (companyName below disambiguates, e.g. "Jan Kowalski — Acme Sp. z o.o.").
  fullName: text("full_name").notNull(),
  email: text("email").notNull(),
  companyName: text("company_name"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const identityDocumentTypeEnum = pgEnum("identity_document_type", [
  "passport",
  "national_id",
  "work_permit",
  "visa",
  "residence_card",
  "other",
]);

export const identityDocumentVerificationStatusEnum = pgEnum("identity_document_verification_status", [
  "pending_review",
  "verified",
  "rejected",
]);

// Employee-uploaded ID/passport/work-permit/visa records — separate from
// employees' own foreignerDocument* columns (which are employer-entered at
// hiring time). This table is employee-self-service, reviewable by the
// tenant admin, and expiry-tracked (powers Phase 4).
export const identityDocuments = pgTable("identity_documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  employeeId: uuid("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  type: identityDocumentTypeEnum("type").notNull(),
  documentNumber: text("document_number"),
  issuingCountry: text("issuing_country"),
  issueDate: date("issue_date", { mode: "string" }),
  expiryDate: date("expiry_date", { mode: "string" }),
  fileRef: text("file_ref").notNull(),
  // Recorded at upload time (server-validated against the 2 MB limit) —
  // avoids a Storage round-trip just to show file size in the review queue.
  fileSizeBytes: integer("file_size_bytes").notNull(),
  verificationStatus: identityDocumentVerificationStatusEnum("verification_status")
    .notNull()
    .default("pending_review"),
  rejectionReason: text("rejection_reason"),
  reviewedBy: uuid("reviewed_by").references(() => profiles.id, { onDelete: "set null" }),
  reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

// Dedupe log for the expiry-reminder cron (app/api/cron/expiry-reminders) —
// without this, a daily sweep would re-email the same 90/30/7-day threshold
// every day until the document is renewed. One row per (document, threshold)
// pair, ever.
export const identityDocumentReminders = pgTable(
  "identity_document_reminders",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    identityDocumentId: uuid("identity_document_id")
      .notNull()
      .references(() => identityDocuments.id, { onDelete: "cascade" }),
    intervalDays: integer("interval_days").notNull(),
    sentAt: timestamp("sent_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [unique().on(table.identityDocumentId, table.intervalDays)],
);

export const documentStatusEnum = pgEnum("document_status", [
  "draft",
  "waiting",
  "employee_signed",
  "completed",
  "archived",
]);

export const documentCategoryEnum = pgEnum("document_category", [
  "hr",
  "legal",
  "finance",
  "operations",
  "sales",
  "custom",
]);

export const templates = pgTable("templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  employerId: uuid("employer_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  tenantId: uuid("tenant_id")
    .notNull()
    .references(() => tenants.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  content: text("content").notNull(),
  placeholders: jsonb("placeholders").notNull().default([]),
  // Documents generated from this template inherit this category (see
  // features/documents/actions.ts::generateDocumentsFromTemplates).
  category: documentCategoryEnum("category").notNull().default("hr"),
  customCategoryLabel: text("custom_category_label"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const documents = pgTable(
  "documents",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    employerId: uuid("employer_id")
      .notNull()
      .references(() => profiles.id, { onDelete: "cascade" }),
    tenantId: uuid("tenant_id")
      .notNull()
      .references(() => tenants.id, { onDelete: "cascade" }),
    // Exactly one of employeeId/signeeId is set — see documents_party_check below.
    // Nullable: a document sent to an external signee has no employees row at all.
    employeeId: uuid("employee_id").references(() => employees.id, { onDelete: "cascade" }),
    signeeId: uuid("signee_id").references(() => signees.id, { onDelete: "cascade" }),
    // Nullable: contract-bundle documents (see lib/documents/generators) are
    // code-driven, not backed by an editable Template row.
    templateId: uuid("template_id").references(() => templates.id),
    title: text("title").notNull(),
    // Generator id (e.g. "umowa_zlecenie") for bundle documents, null for
    // Template-CRUD-driven documents.
    kind: text("kind"),
    // Groups every document produced by one "generate contract" action.
    bundleId: uuid("bundle_id"),
    // Contract end date (main umowa_zlecenie/umowa_o_prace docs only) — powers the
    // dashboard's upcoming-expiration tracker. Null for annexes and open-ended contracts.
    expiresAt: date("expires_at", { mode: "string" }),
    // Who must sign — mirrors GeneratedDocument["signature"] from lib/documents/types.
    signatureType: text("signature_type"),
    // Secure token for the no-login employee signing link. Cleared once used.
    // Not unique: every document generated in one batch that needs an employee
    // signature shares the same token, so the employee signs the whole batch in
    // one visit ("signing session") instead of getting one link per document.
    signingToken: text("signing_token"),
    // Coordinates of the signature-block placeholder(s) drawn at generation time,
    // so a later signing step can place the real signature image in the right spot.
    signatureLayout: jsonb("signature_layout"),
    // Free-text party-role labels for the in-document signature block and the
    // signing certificate — only set for signee-based documents (e.g. "Wynajmujący" /
    // "Najemca"). Null for employee-based documents, which keep the existing
    // hardcoded "Pracodawca / Zleceniodawca" / "Pracownik / Zleceniobiorca" pair.
    senderRoleLabel: text("sender_role_label"),
    counterpartyRoleLabel: text("counterparty_role_label"),
    status: documentStatusEnum("status").notNull().default("draft"),
    pdfUrl: text("pdf_url"),
    finalPdfUrl: text("final_pdf_url"),
    // Document Management module — see lib/documents/document-service.ts
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    category: documentCategoryEnum("category").notNull().default("hr"),
    // Only meaningful when category = "custom".
    customCategoryLabel: text("custom_category_label"),
    // SHA-256 of the current (latest version's) PDF bytes — shown on the Audit
    // Report and the public verification page.
    sha256Hash: text("sha256_hash"),
    // Starts at 0 — recordDocumentVersion (lib/documents/document-service.ts) always increments by
    // one, so the first recorded version becomes 1.
    currentVersion: integer("current_version").notNull().default(0),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "documents_party_check",
      sql`((${table.employeeId} is not null)::int + (${table.signeeId} is not null)::int) = 1`,
    ),
  ],
);

// Immutable snapshot of a document's PDF at one point in its lifecycle
// (generated / employee signed / employer signed / completed). Never
// overwritten — new events append a new row and bump documents.currentVersion.
export const documentVersions = pgTable("document_versions", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentId: uuid("document_id")
    .notNull()
    .references(() => documents.id, { onDelete: "cascade" }),
  versionNumber: integer("version_number").notNull(),
  pdfUrl: text("pdf_url").notNull(),
  sha256Hash: text("sha256_hash").notNull(),
  note: text("note"),
  actorEmail: text("actor_email"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const signatures = pgTable("signatures", {
  id: uuid("id").primaryKey().defaultRandom(),
  documentId: uuid("document_id")
    .notNull()
    .references(() => documents.id, { onDelete: "cascade" }),
  signerEmail: text("signer_email").notNull(),
  imageUrl: text("image_url").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  signedAt: timestamp("signed_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
  // Backfilled from documents.tenant_id where documentId is set; stays
  // nullable indefinitely (an audit row with no document has no tenant to
  // attribute it to — RLS simply hides those rows rather than requiring one).
  tenantId: uuid("tenant_id").references(() => tenants.id, { onDelete: "cascade" }),
  documentId: uuid("document_id").references(() => documents.id, {
    onDelete: "cascade",
  }),
  actorEmail: text("actor_email"),
  action: text("action").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});
