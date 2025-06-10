CREATE TYPE "public"."status_envio_enum" AS ENUM('ENVIADO', 'FALHOU');--> statement-breakpoint
CREATE TABLE "notificacao_historico" (
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
ALTER TABLE "notificacao_historico" ADD CONSTRAINT "notificacao_historico_projeto_id_projeto_id_fk" FOREIGN KEY ("projeto_id") REFERENCES "public"."projeto"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notificacao_historico" ADD CONSTRAINT "notificacao_historico_aluno_id_aluno_id_fk" FOREIGN KEY ("aluno_id") REFERENCES "public"."aluno"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notificacao_historico" ADD CONSTRAINT "notificacao_historico_remetente_user_id_user_id_fk" FOREIGN KEY ("remetente_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;