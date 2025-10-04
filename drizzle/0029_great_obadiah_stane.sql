-- Create enum if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_edital_enum') THEN
        CREATE TYPE "public"."tipo_edital_enum" AS ENUM('DCC', 'PROGRAD');
    END IF;
END $$;--> statement-breakpoint
-- Add column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'edital' AND column_name = 'tipo') THEN
        ALTER TABLE "edital" ADD COLUMN "tipo" "tipo_edital_enum" DEFAULT 'DCC' NOT NULL;
    END IF;
END $$;--> statement-breakpoint
-- Add column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'edital' AND column_name = 'file_id_prograd_original') THEN
        ALTER TABLE "edital" ADD COLUMN "file_id_prograd_original" text;
    END IF;
END $$;