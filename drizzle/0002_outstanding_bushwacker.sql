-- Create enum type if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_documento_projeto_enum') THEN
        CREATE TYPE "public"."tipo_documento_projeto_enum" AS ENUM('PROPOSTA_ORIGINAL', 'PROPOSTA_ASSINADA_PROFESSOR', 'PROPOSTA_ASSINADA_ADMIN', 'ATA_SELECAO');
    END IF;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "projeto_documento" (
	"id" serial PRIMARY KEY NOT NULL,
	"projeto_id" integer NOT NULL,
	"file_id" text NOT NULL,
	"tipo_documento" "tipo_documento_projeto_enum" NOT NULL,
	"assinado_por_user_id" integer,
	"observacoes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
-- Add constraints if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'projeto_documento_projeto_id_projeto_id_fk') THEN
        ALTER TABLE "projeto_documento" ADD CONSTRAINT "projeto_documento_projeto_id_projeto_id_fk" FOREIGN KEY ("projeto_id") REFERENCES "public"."projeto"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;--> statement-breakpoint

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'projeto_documento_assinado_por_user_id_user_id_fk') THEN
        ALTER TABLE "projeto_documento" ADD CONSTRAINT "projeto_documento_assinado_por_user_id_user_id_fk" FOREIGN KEY ("assinado_por_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
    END IF;
END $$;