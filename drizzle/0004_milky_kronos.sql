-- Add columns if not exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'professor' AND column_name = 'curriculum_vitae_file_id') THEN
        ALTER TABLE "professor" ADD COLUMN "curriculum_vitae_file_id" text;
    END IF;
END $$;--> statement-breakpoint

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'professor' AND column_name = 'comprovante_vinculo_file_id') THEN
        ALTER TABLE "professor" ADD COLUMN "comprovante_vinculo_file_id" text;
    END IF;
END $$;