ALTER TABLE "documents" ADD COLUMN "signature_type" text;--> statement-breakpoint
ALTER TABLE "documents" ADD COLUMN "signing_token" text;--> statement-breakpoint
ALTER TABLE "documents" ADD CONSTRAINT "documents_signing_token_unique" UNIQUE("signing_token");