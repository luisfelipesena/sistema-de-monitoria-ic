CREATE TABLE "relatorio_template" (
	"id" serial PRIMARY KEY NOT NULL,
	"titulo" varchar(255) NOT NULL,
	"conteudo" text NOT NULL,
	"criado_por_user_id" integer NOT NULL,
	"is_public" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "relatorio_template" ADD CONSTRAINT "relatorio_template_criado_por_user_id_user_id_fk" FOREIGN KEY ("criado_por_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;