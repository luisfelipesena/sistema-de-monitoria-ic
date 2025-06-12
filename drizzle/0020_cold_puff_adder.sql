CREATE TYPE "public"."modalidade_curso_enum" AS ENUM('PRESENCIAL', 'EAD', 'HIBRIDO');--> statement-breakpoint
CREATE TYPE "public"."status_curso_enum" AS ENUM('ATIVO', 'INATIVO', 'EM_REFORMULACAO');--> statement-breakpoint
CREATE TYPE "public"."tipo_curso_enum" AS ENUM('BACHARELADO', 'LICENCIATURA', 'TECNICO', 'POS_GRADUACAO');--> statement-breakpoint
ALTER TABLE "curso" ADD COLUMN "tipo" "tipo_curso_enum" NOT NULL;--> statement-breakpoint
ALTER TABLE "curso" ADD COLUMN "modalidade" "modalidade_curso_enum" NOT NULL;--> statement-breakpoint
ALTER TABLE "curso" ADD COLUMN "duracao" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "curso" ADD COLUMN "coordenador" varchar;--> statement-breakpoint
ALTER TABLE "curso" ADD COLUMN "email_coordenacao" varchar;--> statement-breakpoint
ALTER TABLE "curso" ADD COLUMN "status" "status_curso_enum" DEFAULT 'ATIVO' NOT NULL;