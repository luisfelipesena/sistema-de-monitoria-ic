CREATE TABLE "ata_selecao" (
	"id" serial PRIMARY KEY NOT NULL,
	"projeto_id" integer NOT NULL,
	"file_id" text,
	"conteudo_html" text,
	"data_geracao" timestamp with time zone DEFAULT now() NOT NULL,
	"gerado_por_user_id" integer NOT NULL,
	"assinado" boolean DEFAULT false NOT NULL,
	"data_assinatura" timestamp with time zone,
	CONSTRAINT "ata_selecao_projeto_id_unique" UNIQUE("projeto_id")
);
--> statement-breakpoint
ALTER TABLE "ata_selecao" ADD CONSTRAINT "ata_selecao_projeto_id_projeto_id_fk" FOREIGN KEY ("projeto_id") REFERENCES "public"."projeto"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ata_selecao" ADD CONSTRAINT "ata_selecao_gerado_por_user_id_user_id_fk" FOREIGN KEY ("gerado_por_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;