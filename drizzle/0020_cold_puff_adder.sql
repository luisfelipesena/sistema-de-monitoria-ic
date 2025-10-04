-- Create enum if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'modalidade_curso_enum') THEN
        CREATE TYPE "public"."modalidade_curso_enum" AS ENUM('PRESENCIAL', 'EAD', 'HIBRIDO');
    END IF;
END $$;--> statement-breakpoint
-- Create enum if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_curso_enum') THEN
        CREATE TYPE "public"."status_curso_enum" AS ENUM('ATIVO', 'INATIVO', 'EM_REFORMULACAO');
    END IF;
END $$;--> statement-breakpoint
-- Create enum if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_curso_enum') THEN
        CREATE TYPE "public"."tipo_curso_enum" AS ENUM('BACHARELADO', 'LICENCIATURA', 'TECNICO', 'POS_GRADUACAO');
    END IF;
END $$;--> statement-breakpoint

-- Primeiro adicionar as colunas como nullable
-- Add column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'curso' AND column_name = 'tipo') THEN
        ALTER TABLE "curso" ADD COLUMN "tipo" "tipo_curso_enum";
    END IF;
END $$;--> statement-breakpoint
-- Add column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'curso' AND column_name = 'modalidade') THEN
        ALTER TABLE "curso" ADD COLUMN "modalidade" "modalidade_curso_enum";
    END IF;
END $$;--> statement-breakpoint
-- Add column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'curso' AND column_name = 'duracao') THEN
        ALTER TABLE "curso" ADD COLUMN "duracao" integer;
    END IF;
END $$;--> statement-breakpoint
-- Add column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'curso' AND column_name = 'coordenador') THEN
        ALTER TABLE "curso" ADD COLUMN "coordenador" varchar;
    END IF;
END $$;--> statement-breakpoint
-- Add column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'curso' AND column_name = 'email_coordenacao') THEN
        ALTER TABLE "curso" ADD COLUMN "email_coordenacao" varchar;
    END IF;
END $$;--> statement-breakpoint
-- Add column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'curso' AND column_name = 'status') THEN
        ALTER TABLE "curso" ADD COLUMN "status" "status_curso_enum" DEFAULT 'ATIVO';
    END IF;
END $$;--> statement-breakpoint

-- Atualizar registros existentes com valores padrão
UPDATE "curso" 
SET "tipo" = 'BACHARELADO', 
    "modalidade" = 'PRESENCIAL', 
    "duracao" = 120
WHERE "tipo" IS NULL OR "modalidade" IS NULL OR "duracao" IS NULL;--> statement-breakpoint

-- Agora tornar as colunas NOT NULL
ALTER TABLE "curso" ALTER COLUMN "tipo" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "curso" ALTER COLUMN "modalidade" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "curso" ALTER COLUMN "duracao" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "curso" ALTER COLUMN "status" SET NOT NULL;