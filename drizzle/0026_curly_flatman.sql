-- Add column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projeto' AND column_name = 'disciplina_nome') THEN
        ALTER TABLE "projeto" ADD COLUMN "disciplina_nome" varchar;
    END IF;
END $$;--> statement-breakpoint
-- Add column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projeto' AND column_name = 'professores_participantes') THEN
        ALTER TABLE "projeto" ADD COLUMN "professores_participantes" text;
    END IF;
END $$;