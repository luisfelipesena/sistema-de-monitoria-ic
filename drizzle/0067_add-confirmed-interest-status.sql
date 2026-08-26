ALTER TYPE "public"."status_inscricao_enum" ADD VALUE 'CONFIRMED_INTEREST' BEFORE 'ACCEPTED_BOLSISTA';--> statement-breakpoint
CREATE TABLE "email_notificacao" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" varchar(255) NOT NULL,
	"email" text NOT NULL,
	"descricao" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "assinatura_documento" DROP CONSTRAINT "assinatura_documento_edital_id_edital_id_fk";
--> statement-breakpoint
ALTER TABLE "projeto" DROP CONSTRAINT "projeto_edital_interno_id_edital_id_fk";
--> statement-breakpoint
ALTER TABLE "edital" ADD COLUMN "data_inicio_alteracao" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "edital" ADD COLUMN "data_fim_alteracao" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "projeto" ADD COLUMN "dados_edital_confirmados" boolean DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE "assinatura_documento" ADD CONSTRAINT "assinatura_documento_edital_id_edital_id_fk" FOREIGN KEY ("edital_id") REFERENCES "public"."edital"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projeto" ADD CONSTRAINT "projeto_edital_interno_id_edital_id_fk" FOREIGN KEY ("edital_interno_id") REFERENCES "public"."edital"("id") ON DELETE set null ON UPDATE no action;