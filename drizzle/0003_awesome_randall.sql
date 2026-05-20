-- Add enum value if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'PENDING_PROFESSOR_SIGNATURE' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'projeto_status_enum')) THEN
        ALTER TYPE "public"."projeto_status_enum" ADD VALUE 'PENDING_PROFESSOR_SIGNATURE';
    END IF;
END $$;--> statement-breakpoint

-- Add columns if not exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'aluno' AND column_name = 'historico_escolar_file_id') THEN
        ALTER TABLE "aluno" ADD COLUMN "historico_escolar_file_id" text;
    END IF;
END $$;--> statement-breakpoint

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'aluno' AND column_name = 'comprovante_matricula_file_id') THEN
        ALTER TABLE "aluno" ADD COLUMN "comprovante_matricula_file_id" text;
    END IF;
END $$;