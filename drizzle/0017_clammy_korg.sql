CREATE TYPE "public"."tipo_notificacao_enum" AS ENUM('PROFESSOR_INVITATION', 'PROJECT_SUBMITTED', 'PROJECT_APPROVED', 'PROJECT_REJECTED', 'SELECTION_RESULTS', 'BULK_REMINDER', 'PROJETO_SUBMETIDO', 'PROJETO_APROVADO', 'PROJETO_REJEITADO', 'LEMBRETE_PROJETO', 'LEMBRETE_SELECAO');--> statement-breakpoint
CREATE TABLE "notification" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"tipo" "tipo_notificacao_enum" NOT NULL,
	"titulo" varchar(255) NOT NULL,
	"mensagem" text NOT NULL,
	"metadata" text,
	"lida" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "curso" ADD COLUMN "departamento_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "curso" ADD COLUMN "carga_horaria" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "curso" ADD COLUMN "descricao" text;--> statement-breakpoint
ALTER TABLE "professor_invitation" ADD COLUMN "accepted_at" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "projeto" ADD COLUMN "periodo_inscricao_id" integer;--> statement-breakpoint
ALTER TABLE "projeto" ADD COLUMN "observacoes_admin" text;--> statement-breakpoint
ALTER TABLE "projeto" ADD COLUMN "resultados_publicados" boolean DEFAULT false;--> statement-breakpoint
ALTER TABLE "projeto" ADD COLUMN "data_publicacao_resultados" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "notification" ADD CONSTRAINT "notification_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "curso" ADD CONSTRAINT "curso_departamento_id_departamento_id_fk" FOREIGN KEY ("departamento_id") REFERENCES "public"."departamento"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projeto" ADD CONSTRAINT "projeto_periodo_inscricao_id_periodo_inscricao_id_fk" FOREIGN KEY ("periodo_inscricao_id") REFERENCES "public"."periodo_inscricao"("id") ON DELETE no action ON UPDATE no action;