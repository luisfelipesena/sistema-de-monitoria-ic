-- Create enum if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'status_envio_enum') THEN
        CREATE TYPE "public"."status_envio_enum" AS ENUM('ENVIADO', 'FALHOU');
    END IF;
END $$;--> statement-breakpoint

CREATE TABLE IF NOT EXISTS "notificacao_historico" (
	"id" serial PRIMARY KEY NOT NULL,
	"destinatario_email" text NOT NULL,
	"assunto" varchar(255) NOT NULL,
	"tipo_notificacao" varchar(100) NOT NULL,
	"status_envio" "status_envio_enum" NOT NULL,
	"data_envio" timestamp with time zone DEFAULT now() NOT NULL,
	"mensagem_erro" text,
	"projeto_id" integer,
	"aluno_id" integer,
	"remetente_user_id" integer
);
--> statement-breakpoint
-- Add constraint if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'notificacao_historico_projeto_id_projeto_id_fk') THEN
        ALTER TABLE "notificacao_historico" ADD CONSTRAINT "notificacao_historico_projeto_id_projeto_id_fk" FOREIGN KEY ("projeto_id") REFERENCES "public"."projeto"("id") ON DELETE no action ON UPDATE no action;
    END IF;
END $$;--> statement-breakpoint
-- Add constraint if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'notificacao_historico_aluno_id_aluno_id_fk') THEN
        ALTER TABLE "notificacao_historico" ADD CONSTRAINT "notificacao_historico_aluno_id_aluno_id_fk" FOREIGN KEY ("aluno_id") REFERENCES "public"."aluno"("id") ON DELETE no action ON UPDATE no action;
    END IF;
END $$;--> statement-breakpoint
-- Add constraint if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'notificacao_historico_remetente_user_id_user_id_fk') THEN
        ALTER TABLE "notificacao_historico" ADD CONSTRAINT "notificacao_historico_remetente_user_id_user_id_fk" FOREIGN KEY ("remetente_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
    END IF;
END $$;