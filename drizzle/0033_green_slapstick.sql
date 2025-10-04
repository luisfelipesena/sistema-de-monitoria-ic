ALTER TABLE "edital" ADD COLUMN "chefe_assinou_em" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "edital" ADD COLUMN "chefe_assinatura" text;--> statement-breakpoint
ALTER TABLE "edital" ADD COLUMN "chefe_departamento_id" integer;--> statement-breakpoint
ALTER TABLE "edital" ADD CONSTRAINT "edital_chefe_departamento_id_user_id_fk" FOREIGN KEY ("chefe_departamento_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;