-- Migration: 0034_woozy_spitfire
-- Add edital interno DCC fields and projeto-edital relationship

-- Add campos edital interno DCC (with IF NOT EXISTS)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'edital' AND column_name = 'pontos_prova') THEN
        ALTER TABLE "edital" ADD COLUMN "pontos_prova" text;
    END IF;
END $$;--> statement-breakpoint

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'edital' AND column_name = 'bibliografia') THEN
        ALTER TABLE "edital" ADD COLUMN "bibliografia" text;
    END IF;
END $$;--> statement-breakpoint

-- Add projeto-edital relationship (with IF NOT EXISTS)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projeto' AND column_name = 'edital_interno_id') THEN
        ALTER TABLE "projeto" ADD COLUMN "edital_interno_id" integer;
    END IF;
END $$;--> statement-breakpoint

-- Add foreign key constraint (with IF NOT EXISTS)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'projeto_edital_interno_id_edital_id_fk') THEN
        ALTER TABLE "projeto" ADD CONSTRAINT "projeto_edital_interno_id_edital_id_fk"
        FOREIGN KEY ("edital_interno_id") REFERENCES "public"."edital"("id") ON DELETE no action ON UPDATE no action;
    END IF;
END $$;