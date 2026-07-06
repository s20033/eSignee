ALTER TABLE "documents" ALTER COLUMN "template_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "title" text NOT NULL;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "kind" text;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "bundle_id" uuid;