CREATE TYPE "public"."document_category" AS ENUM('hr', 'legal', 'finance', 'operations', 'sales', 'custom');--> statement-breakpoint
CREATE TABLE "document_versions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"document_id" uuid NOT NULL,
	"version_number" integer NOT NULL,
	"pdf_url" text NOT NULL,
	"sha256_hash" text NOT NULL,
	"note" text,
	"actor_email" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "deleted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "category" "document_category" DEFAULT 'hr' NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "custom_category_label" text;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "sha256_hash" text;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "current_version" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "signatures" ADD COLUMN "user_agent" text;--> statement-breakpoint
ALTER TABLE "document_versions" ADD CONSTRAINT "document_versions_document_id_documents_id_fk" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE cascade ON UPDATE no action;