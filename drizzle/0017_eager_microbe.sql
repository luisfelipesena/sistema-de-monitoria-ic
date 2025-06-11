ALTER TABLE "curso" ADD COLUMN "departamento_id" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "curso" ADD COLUMN "carga_horaria" integer NOT NULL;--> statement-breakpoint
ALTER TABLE "curso" ADD COLUMN "descricao" text;--> statement-breakpoint
ALTER TABLE "projeto" ADD COLUMN "assinatura_admin" text;--> statement-breakpoint
ALTER TABLE "curso" ADD CONSTRAINT "curso_departamento_id_departamento_id_fk" FOREIGN KEY ("departamento_id") REFERENCES "public"."departamento"("id") ON DELETE no action ON UPDATE no action;