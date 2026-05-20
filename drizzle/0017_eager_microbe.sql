-- Primeiro adicionar a coluna como nullable
-- Add column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'curso' AND column_name = 'departamento_id') THEN
        ALTER TABLE "curso" ADD COLUMN "departamento_id" integer;
    END IF;
END $$;--> statement-breakpoint
-- Add column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'curso' AND column_name = 'carga_horaria') THEN
        ALTER TABLE "curso" ADD COLUMN "carga_horaria" integer DEFAULT 0;
    END IF;
END $$;--> statement-breakpoint
-- Add column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'curso' AND column_name = 'descricao') THEN
        ALTER TABLE "curso" ADD COLUMN "descricao" text;
    END IF;
END $$;--> statement-breakpoint
-- Add column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projeto' AND column_name = 'assinatura_admin') THEN
        ALTER TABLE "projeto" ADD COLUMN "assinatura_admin" text;
    END IF;
END $$;--> statement-breakpoint

-- Atualizar registros existentes para ter um departamento padrão
UPDATE "curso" 
SET "departamento_id" = (
  SELECT COALESCE(MIN(id), 1) FROM "departamento"
), 
"carga_horaria" = COALESCE("carga_horaria", 120)
WHERE "departamento_id" IS NULL OR "carga_horaria" IS NULL;--> statement-breakpoint

-- Agora tornar as colunas NOT NULL
ALTER TABLE "curso" ALTER COLUMN "departamento_id" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "curso" ALTER COLUMN "carga_horaria" SET NOT NULL;--> statement-breakpoint

-- Adicionar a foreign key constraint
-- Add constraint if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'curso_departamento_id_departamento_id_fk') THEN
        ALTER TABLE "curso" ADD CONSTRAINT "curso_departamento_id_departamento_id_fk" FOREIGN KEY ("departamento_id") REFERENCES "public"."departamento"("id") ON DELETE no action ON UPDATE no action;
    END IF;
END $$;