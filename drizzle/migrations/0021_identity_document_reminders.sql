CREATE TABLE IF NOT EXISTS "identity_document_reminders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"identity_document_id" uuid NOT NULL,
	"interval_days" integer NOT NULL,
	"sent_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "identity_document_reminders_identity_document_id_interval_days_unique" UNIQUE("identity_document_id","interval_days")
);
--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "identity_document_reminders" ADD CONSTRAINT "identity_document_reminders_identity_document_id_identity_documents_id_fk" FOREIGN KEY ("identity_document_id") REFERENCES "public"."identity_documents"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN null;
END $$;
