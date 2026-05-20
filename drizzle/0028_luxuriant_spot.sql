-- Add column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'password_reset_token') THEN
        ALTER TABLE "user" ADD COLUMN "password_reset_token" text;
    END IF;
END $$;--> statement-breakpoint
-- Add column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'password_reset_expires_at') THEN
        ALTER TABLE "user" ADD COLUMN "password_reset_expires_at" timestamp with time zone;
    END IF;
END $$;