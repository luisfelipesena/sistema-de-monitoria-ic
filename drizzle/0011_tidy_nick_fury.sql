-- Create enum if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'professor_invitation_status_enum') THEN
        CREATE TYPE "public"."professor_invitation_status_enum" AS ENUM('PENDING', 'ACCEPTED', 'EXPIRED');
    END IF;
END $$;--> statement-breakpoint
-- Create enum if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'tipo_assinatura_enum') THEN
        CREATE TYPE "public"."tipo_assinatura_enum" AS ENUM('PROJETO_PROFESSOR_RESPONSAVEL', 'TERMO_COMPROMISSO_ALUNO', 'EDITAL_ADMIN', 'ATA_SELECAO_PROFESSOR');
    END IF;
END $$;--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "assinatura_documento" (
	"id" serial PRIMARY KEY NOT NULL,
	"assinatura_data" text NOT NULL,
	"tipo_assinatura" "tipo_assinatura_enum" NOT NULL,
	"user_id" integer NOT NULL,
	"projeto_id" integer,
	"vaga_id" integer,
	"edital_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "professor_invitation" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"token" varchar(255) NOT NULL,
	"status" "professor_invitation_status_enum" DEFAULT 'PENDING' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"invited_by_user_id" integer NOT NULL,
	"accepted_by_user_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "professor_invitation_email_unique" UNIQUE("email"),
	CONSTRAINT "professor_invitation_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "projeto_template" (
	"id" serial PRIMARY KEY NOT NULL,
	"disciplina_id" integer NOT NULL,
	"titulo_default" varchar(255),
	"descricao_default" text,
	"carga_horaria_semana_default" integer,
	"numero_semanas_default" integer,
	"publico_alvo_default" text,
	"atividades_default" text,
	"criado_por_user_id" integer NOT NULL,
	"ultima_atualizacao_user_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "projeto_template_disciplina_id_unique" UNIQUE("disciplina_id")
);
--> statement-breakpoint
-- Add constraint if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'assinatura_documento_user_id_user_id_fk') THEN
        ALTER TABLE "assinatura_documento" ADD CONSTRAINT "assinatura_documento_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
    END IF;
END $$;--> statement-breakpoint
-- Add constraint if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'assinatura_documento_projeto_id_projeto_id_fk') THEN
        ALTER TABLE "assinatura_documento" ADD CONSTRAINT "assinatura_documento_projeto_id_projeto_id_fk" FOREIGN KEY ("projeto_id") REFERENCES "public"."projeto"("id") ON DELETE no action ON UPDATE no action;
    END IF;
END $$;--> statement-breakpoint
-- Add constraint if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'assinatura_documento_vaga_id_vaga_id_fk') THEN
        ALTER TABLE "assinatura_documento" ADD CONSTRAINT "assinatura_documento_vaga_id_vaga_id_fk" FOREIGN KEY ("vaga_id") REFERENCES "public"."vaga"("id") ON DELETE no action ON UPDATE no action;
    END IF;
END $$;--> statement-breakpoint
-- Add constraint if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'assinatura_documento_edital_id_edital_id_fk') THEN
        ALTER TABLE "assinatura_documento" ADD CONSTRAINT "assinatura_documento_edital_id_edital_id_fk" FOREIGN KEY ("edital_id") REFERENCES "public"."edital"("id") ON DELETE no action ON UPDATE no action;
    END IF;
END $$;--> statement-breakpoint
-- Add constraint if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'professor_invitation_invited_by_user_id_user_id_fk') THEN
        ALTER TABLE "professor_invitation" ADD CONSTRAINT "professor_invitation_invited_by_user_id_user_id_fk" FOREIGN KEY ("invited_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
    END IF;
END $$;--> statement-breakpoint
-- Add constraint if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'professor_invitation_accepted_by_user_id_user_id_fk') THEN
        ALTER TABLE "professor_invitation" ADD CONSTRAINT "professor_invitation_accepted_by_user_id_user_id_fk" FOREIGN KEY ("accepted_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
    END IF;
END $$;--> statement-breakpoint
-- Add constraint if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'projeto_template_disciplina_id_disciplina_id_fk') THEN
        ALTER TABLE "projeto_template" ADD CONSTRAINT "projeto_template_disciplina_id_disciplina_id_fk" FOREIGN KEY ("disciplina_id") REFERENCES "public"."disciplina"("id") ON DELETE no action ON UPDATE no action;
    END IF;
END $$;--> statement-breakpoint
-- Add constraint if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'projeto_template_criado_por_user_id_user_id_fk') THEN
        ALTER TABLE "projeto_template" ADD CONSTRAINT "projeto_template_criado_por_user_id_user_id_fk" FOREIGN KEY ("criado_por_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
    END IF;
END $$;--> statement-breakpoint
-- Add constraint if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'projeto_template_ultima_atualizacao_user_id_user_id_fk') THEN
        ALTER TABLE "projeto_template" ADD CONSTRAINT "projeto_template_ultima_atualizacao_user_id_user_id_fk" FOREIGN KEY ("ultima_atualizacao_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
    END IF;
END $$;