-- Add column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'password_hash') THEN
        ALTER TABLE "user" ADD COLUMN "password_hash" text;
    END IF;
END $$;--> statement-breakpoint
-- Add column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'email_verified_at') THEN
        ALTER TABLE "user" ADD COLUMN "email_verified_at" timestamp with time zone;
    END IF;
END $$;--> statement-breakpoint
-- Add column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'verification_token') THEN
        ALTER TABLE "user" ADD COLUMN "verification_token" text;
    END IF;
END $$;--> statement-breakpoint
-- Add column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'verification_token_expires_at') THEN
        ALTER TABLE "user" ADD COLUMN "verification_token_expires_at" timestamp with time zone;
    END IF;
END $$;