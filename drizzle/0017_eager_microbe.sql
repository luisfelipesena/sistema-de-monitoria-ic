-- Primeiro adicionar a coluna como nullable
ALTER TABLE "curso" ADD COLUMN "departamento_id" integer;--> statement-breakpoint
ALTER TABLE "curso" ADD COLUMN "carga_horaria" integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE "curso" ADD COLUMN "descricao" text;--> statement-breakpoint
ALTER TABLE "projeto" ADD COLUMN "assinatura_admin" text;--> statement-breakpoint

-- Atualizar registros existentes para ter um departamento padrão
UPDATE "curso" 
SET "departamento_id" = (
  SELECT MIN(id) FROM "departamento" LIMIT 1
), 
"carga_horaria" = COALESCE("carga_horaria", 120)
WHERE "departamento_id" IS NULL OR "carga_horaria" IS NULL;--> statement-breakpoint

-- Agora tornar as colunas NOT NULL
ALTER TABLE "curso" ALTER COLUMN "departamento_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "curso" ALTER COLUMN "carga_horaria" SET NOT NULL;--> statement-breakpoint

-- Adicionar a foreign key constraint
ALTER TABLE "curso" ADD CONSTRAINT "curso_departamento_id_departamento_id_fk" FOREIGN KEY ("departamento_id") REFERENCES "public"."departamento"("id") ON DELETE no action ON UPDATE no action;