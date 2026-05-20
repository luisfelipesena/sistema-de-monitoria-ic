-- Add column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'departamento' AND column_name = 'coordenador') THEN
        ALTER TABLE "departamento" ADD COLUMN "coordenador" varchar;
    END IF;
END $$;--> statement-breakpoint
-- Add column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'departamento' AND column_name = 'email') THEN
        ALTER TABLE "departamento" ADD COLUMN "email" varchar;
    END IF;
END $$;--> statement-breakpoint
-- Add column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'departamento' AND column_name = 'telefone') THEN
        ALTER TABLE "departamento" ADD COLUMN "telefone" varchar;
    END IF;
END $$;--> statement-breakpoint
-- Add column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'departamento' AND column_name = 'descricao') THEN
        ALTER TABLE "departamento" ADD COLUMN "descricao" text;
    END IF;
END $$;