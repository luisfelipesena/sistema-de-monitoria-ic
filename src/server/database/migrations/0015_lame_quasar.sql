-- Primeiro, atualizar registros com codigo NULL
-- Usar uma query mais simples que funciona garantidamente
UPDATE "curso" 
SET "codigo" = (
  SELECT COALESCE(
    (SELECT MAX("codigo") FROM "curso" WHERE "codigo" IS NOT NULL), 
    0
  ) + "id"
) 
WHERE "codigo" IS NULL;--> statement-breakpoint

ALTER TABLE "disciplina" DROP CONSTRAINT "disciplina_codigo_unique";--> statement-breakpoint
ALTER TABLE "curso" ALTER COLUMN "codigo" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "departamento" ALTER COLUMN "unidade_universitaria" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "codigo_unico_por_departamento_idx" ON "disciplina" USING btree ("codigo","departamento_id");