CREATE TYPE "public"."relatorio_status_enum" AS ENUM('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED');--> statement-breakpoint
CREATE TABLE "relatorio_final_disciplina" (
	"id" serial PRIMARY KEY NOT NULL,
	"projeto_id" integer NOT NULL,
	"conteudo" text NOT NULL,
	"status" "relatorio_status_enum" DEFAULT 'DRAFT' NOT NULL,
	"professor_assinou_em" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "relatorio_final_disciplina_projeto_id_unique" UNIQUE("projeto_id")
);
--> statement-breakpoint
CREATE TABLE "relatorio_final_monitor" (
	"id" serial PRIMARY KEY NOT NULL,
	"inscricao_id" integer NOT NULL,
	"relatorio_disciplina_id" integer NOT NULL,
	"conteudo" text NOT NULL,
	"status" "relatorio_status_enum" DEFAULT 'DRAFT' NOT NULL,
	"aluno_assinou_em" timestamp with time zone,
	"professor_assinou_em" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "relatorio_final_monitor_inscricao_id_unique" UNIQUE("inscricao_id")
);
--> statement-breakpoint
ALTER TABLE "relatorio_final_disciplina" ADD CONSTRAINT "relatorio_final_disciplina_projeto_id_projeto_id_fk" FOREIGN KEY ("projeto_id") REFERENCES "public"."projeto"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relatorio_final_monitor" ADD CONSTRAINT "relatorio_final_monitor_inscricao_id_inscricao_id_fk" FOREIGN KEY ("inscricao_id") REFERENCES "public"."inscricao"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "relatorio_final_monitor" ADD CONSTRAINT "relatorio_final_monitor_relatorio_disciplina_id_relatorio_final_disciplina_id_fk" FOREIGN KEY ("relatorio_disciplina_id") REFERENCES "public"."relatorio_final_disciplina"("id") ON DELETE cascade ON UPDATE no action;