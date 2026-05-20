-- Add column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'edital' AND column_name = 'chefe_assinou_em') THEN
        ALTER TABLE "edital" ADD COLUMN "chefe_assinou_em" timestamp with time zone;
    END IF;
END $$;--> statement-breakpoint
-- Add column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'edital' AND column_name = 'chefe_assinatura') THEN
        ALTER TABLE "edital" ADD COLUMN "chefe_assinatura" text;
    END IF;
END $$;--> statement-breakpoint
-- Add column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'edital' AND column_name = 'chefe_departamento_id') THEN
        ALTER TABLE "edital" ADD COLUMN "chefe_departamento_id" integer;
    END IF;
END $$;--> statement-breakpoint
-- Add constraint if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'edital_chefe_departamento_id_user_id_fk') THEN
        ALTER TABLE "edital" ADD CONSTRAINT "edital_chefe_departamento_id_user_id_fk" FOREIGN KEY ("chefe_departamento_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
    END IF;
END $$;