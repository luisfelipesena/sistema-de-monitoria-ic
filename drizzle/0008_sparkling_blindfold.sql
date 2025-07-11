ALTER TYPE "public"."projeto_status_enum" ADD VALUE 'PENDING_PROFESSOR_SIGNATURE';--> statement-breakpoint
CREATE TABLE "importacao_planejamento" (
	"id" serial PRIMARY KEY NOT NULL,
	"file_id" text NOT NULL,
	"nome_arquivo" varchar NOT NULL,
	"ano" integer NOT NULL,
	"semestre" "semestre_enum" NOT NULL,
	"total_projetos" integer DEFAULT 0 NOT NULL,
	"projetos_criados" integer DEFAULT 0 NOT NULL,
	"projetos_com_erro" integer DEFAULT 0 NOT NULL,
	"status" varchar DEFAULT 'PROCESSANDO' NOT NULL,
	"erros" text,
	"importado_por_user_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "importacao_planejamento" ADD CONSTRAINT "importacao_planejamento_importado_por_user_id_user_id_fk" FOREIGN KEY ("importado_por_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;