ALTER TABLE "employees" ADD COLUMN "passport_number" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "pesel" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "nationality" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "address" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "bank_name" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "iban" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "job_description" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "end_date" date;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "hourly_rate" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "min_hours_per_week" numeric(5, 1);--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "accommodation_cost" numeric(10, 2);--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "is_foreigner" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "citizenship" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "foreigner_document_type" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "foreigner_document_number" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "foreigner_document_expiry" date;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "work_basis" text;--> statement-breakpoint
ALTER TABLE "employees" ADD COLUMN "is_student" boolean DEFAULT false NOT NULL;