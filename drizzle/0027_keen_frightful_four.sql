ALTER TABLE "user" ADD COLUMN "password_hash" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "email_verified_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "verification_token" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "verification_token_expires_at" timestamp with time zone;