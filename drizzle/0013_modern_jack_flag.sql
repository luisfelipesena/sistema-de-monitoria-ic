-- Add enum value if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'PROJETO_COORDENADOR_DEPARTAMENTO' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'tipo_assinatura_enum')) THEN
        ALTER TYPE "public"."tipo_assinatura_enum" ADD VALUE 'PROJETO_COORDENADOR_DEPARTAMENTO';
    END IF;
END $$;--> statement-breakpoint
-- Add column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inscricao' AND column_name = 'nota_disciplina') THEN
        ALTER TABLE "inscricao" ADD COLUMN "nota_disciplina" numeric(4, 2);
    END IF;
END $$;--> statement-breakpoint
-- Add column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inscricao' AND column_name = 'nota_selecao') THEN
        ALTER TABLE "inscricao" ADD COLUMN "nota_selecao" numeric(4, 2);
    END IF;
END $$;--> statement-breakpoint
-- Add column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inscricao' AND column_name = 'cr') THEN
        ALTER TABLE "inscricao" ADD COLUMN "cr" numeric(4, 2);
    END IF;
END $$;--> statement-breakpoint
-- Add column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inscricao' AND column_name = 'nota_final') THEN
        ALTER TABLE "inscricao" ADD COLUMN "nota_final" numeric(4, 2);
    END IF;
END $$;