CREATE TABLE IF NOT EXISTS "edital" (
	"id" serial PRIMARY KEY NOT NULL,
	"periodo_inscricao_id" integer NOT NULL,
	"numero_edital" varchar(50) NOT NULL,
	"titulo" varchar(255) DEFAULT 'Edital Interno de Seleção de Monitores' NOT NULL,
	"descricao_html" text,
	"file_id_assinado" text,
	"data_publicacao" date,
	"publicado" boolean DEFAULT false NOT NULL,
	"criado_por_user_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "edital_periodo_inscricao_id_unique" UNIQUE("periodo_inscricao_id"),
	CONSTRAINT "edital_numero_edital_unique" UNIQUE("numero_edital")
);
--> statement-breakpoint
-- Add constraint if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'edital_periodo_inscricao_id_periodo_inscricao_id_fk') THEN
        ALTER TABLE "edital" ADD CONSTRAINT "edital_periodo_inscricao_id_periodo_inscricao_id_fk" FOREIGN KEY ("periodo_inscricao_id") REFERENCES "public"."periodo_inscricao"("id") ON DELETE no action ON UPDATE no action;
    END IF;
END $$;--> statement-breakpoint
-- Add constraint if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'edital_criado_por_user_id_user_id_fk') THEN
        ALTER TABLE "edital" ADD CONSTRAINT "edital_criado_por_user_id_user_id_fk" FOREIGN KEY ("criado_por_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
    END IF;
END $$;