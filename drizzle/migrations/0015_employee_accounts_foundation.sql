ALTER TABLE "employees" ADD COLUMN IF NOT EXISTS "user_id" uuid;--> statement-breakpoint
ALTER TABLE "profiles" ADD COLUMN IF NOT EXISTS "rejection_reason" text;--> statement-breakpoint
ALTER TABLE "tenants" ADD COLUMN IF NOT EXISTS "employee_invite_code" text;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "employees" ADD CONSTRAINT "employees_user_id_profiles_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE set null ON UPDATE no action;
EXCEPTION WHEN duplicate_object OR duplicate_table THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "employees" ADD CONSTRAINT "employees_user_id_unique" UNIQUE("user_id");
EXCEPTION WHEN duplicate_object OR duplicate_table THEN null;
END $$;--> statement-breakpoint
DO $$ BEGIN
  ALTER TABLE "tenants" ADD CONSTRAINT "tenants_employee_invite_code_unique" UNIQUE("employee_invite_code");
EXCEPTION WHEN duplicate_object OR duplicate_table THEN null;
END $$;
