import {
  boolean,
  date,
  jsonb,
  numeric,
  pgEnum,
  pgSchema,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

const authSchema = pgSchema("auth");

export const authUsers = authSchema.table("users", {
  id: uuid("id").primaryKey(),
});

export const profiles = pgTable("profiles", {
  id: uuid("id")
    .primaryKey()
    .references(() => authUsers.id, { onDelete: "cascade" }),
  email: text("email").notNull(),
  companyName: text("company_name").notNull(),

  // Company branding — used on generated PDF letterheads
  address: text("address"),
  taxId: text("tax_id"),
  regon: text("regon"),
  krs: text("krs"),
  logoUrl: text("logo_url"),

  notifyOnSignatureNeeded: boolean("notify_on_signature_needed").notNull().default(true),

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

export const documentStatusEnum = pgEnum("document_status", [
  "draft",
  "waiting",
  "employee_signed",
  "completed",
  "archived",
]);

export const templates = pgTable("templates", {
  id: uuid("id").primaryKey().defaultRandom(),
  employerId: uuid("employer_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  name: text("name").notNull(),
  content: text("content").notNull(),
  placeholders: jsonb("placeholders").notNull().default([]),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  deletedAt: timestamp("deleted_at", { withTimezone: true }),
});

export const documents = pgTable("documents", {
  id: uuid("id").primaryKey().defaultRandom(),
  employerId: uuid("employer_id")
    .notNull()
    .references(() => profiles.id, { onDelete: "cascade" }),
  employeeId: uuid("employee_id")
    .notNull()
    .references(() => employees.id, { onDelete: "cascade" }),
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
  signingToken: text("signing_token").unique(),
  // Coordinates of the signature-block placeholder(s) drawn at generation time,
  // so a later signing step can place the real signature image in the right spot.
  signatureLayout: jsonb("signature_layout"),
  status: documentStatusEnum("status").notNull().default("draft"),
  pdfUrl: text("pdf_url"),
  finalPdfUrl: text("final_pdf_url"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
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
  signedAt: timestamp("signed_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const auditLogs = pgTable("audit_logs", {
  id: uuid("id").primaryKey().defaultRandom(),
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
