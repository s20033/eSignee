DO $$ BEGIN
  CREATE TYPE "public"."identity_document_type" AS ENUM('passport', 'national_id', 'work_permit', 'visa', 'residence_card', 'other');
EXCEPTION WHEN duplicate_object OR duplicate_table THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  CREATE TYPE "public"."identity_document_verification_status" AS ENUM('pending_review', 'verified', 'rejected');
EXCEPTION WHEN duplicate_object OR duplicate_table THEN null;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "identity_documents" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"employee_id" uuid NOT NULL,
	"tenant_id" uuid NOT NULL,
	"type" "identity_document_type" NOT NULL,
	"document_number" text,
	"issuing_country" text,
	"issue_date" date,
	"expiry_date" date,
	"file_ref" text NOT NULL,
	"file_size_bytes" integer NOT NULL,
	"verification_status" "identity_document_verification_status" DEFAULT 'pending_review' NOT NULL,
	"rejection_reason" text,
	"reviewed_by" uuid,
	"reviewed_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "identity_documents" ADD CONSTRAINT "identity_documents_employee_id_employees_id_fk" FOREIGN KEY ("employee_id") REFERENCES "public"."employees"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "identity_documents" ADD CONSTRAINT "identity_documents_tenant_id_tenants_id_fk" FOREIGN KEY ("tenant_id") REFERENCES "public"."tenants"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "identity_documents" ADD CONSTRAINT "identity_documents_reviewed_by_profiles_id_fk" FOREIGN KEY ("reviewed_by") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN null;
END $$;
