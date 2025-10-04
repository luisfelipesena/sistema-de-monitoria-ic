-- Add column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'professor' AND column_name = 'assinatura_default') THEN
        ALTER TABLE "professor" ADD COLUMN "assinatura_default" text;
    END IF;
END $$;--> statement-breakpoint
-- Add column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'professor' AND column_name = 'data_assinatura_default') THEN
        ALTER TABLE "professor" ADD COLUMN "data_assinatura_default" timestamp with time zone;
    END IF;
END $$;--> statement-breakpoint
-- Add column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'assinatura_default') THEN
        ALTER TABLE "user" ADD COLUMN "assinatura_default" text;
    END IF;
END $$;--> statement-breakpoint
-- Add column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user' AND column_name = 'data_assinatura_default') THEN
        ALTER TABLE "user" ADD COLUMN "data_assinatura_default" timestamp with time zone;
    END IF;
END $$;