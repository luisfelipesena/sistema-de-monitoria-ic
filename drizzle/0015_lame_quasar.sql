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

-- Drop constraint if exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'disciplina_codigo_unique' AND table_name = 'disciplina') THEN
        ALTER TABLE "disciplina" DROP CONSTRAINT "disciplina_codigo_unique";
    END IF;
END $$;--> statement-breakpoint
ALTER TABLE "curso" ALTER COLUMN "codigo" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "departamento" ALTER COLUMN "unidade_universitaria" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "codigo_unico_por_departamento_idx" ON "disciplina" USING btree ("codigo","departamento_id");