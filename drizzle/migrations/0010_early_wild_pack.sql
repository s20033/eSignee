ALTER TABLE "templates" ADD COLUMN "category" "document_category" DEFAULT 'hr' NOT NULL;--> statement-breakpoint
ALTER TABLE "templates" ADD COLUMN "custom_category_label" text;