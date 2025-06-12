CREATE TYPE "public"."modalidade_curso_enum" AS ENUM('PRESENCIAL', 'EAD', 'HIBRIDO');--> statement-breakpoint
CREATE TYPE "public"."status_curso_enum" AS ENUM('ATIVO', 'INATIVO', 'EM_REFORMULACAO');--> statement-breakpoint
CREATE TYPE "public"."tipo_curso_enum" AS ENUM('BACHARELADO', 'LICENCIATURA', 'TECNICO', 'POS_GRADUACAO');--> statement-breakpoint

-- Primeiro adicionar as colunas como nullable
ALTER TABLE "curso" ADD COLUMN "tipo" "tipo_curso_enum";--> statement-breakpoint
ALTER TABLE "curso" ADD COLUMN "modalidade" "modalidade_curso_enum";--> statement-breakpoint
ALTER TABLE "curso" ADD COLUMN "duracao" integer;--> statement-breakpoint
ALTER TABLE "curso" ADD COLUMN "coordenador" varchar;--> statement-breakpoint
ALTER TABLE "curso" ADD COLUMN "email_coordenacao" varchar;--> statement-breakpoint
ALTER TABLE "curso" ADD COLUMN "status" "status_curso_enum" DEFAULT 'ATIVO';--> statement-breakpoint

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