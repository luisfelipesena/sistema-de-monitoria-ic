-- Add column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'aluno' AND column_name = 'banco') THEN
        ALTER TABLE "aluno" ADD COLUMN "banco" varchar(100);
    END IF;
END $$;--> statement-breakpoint
-- Add column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'aluno' AND column_name = 'agencia') THEN
        ALTER TABLE "aluno" ADD COLUMN "agencia" varchar(20);
    END IF;
END $$;--> statement-breakpoint
-- Add column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'aluno' AND column_name = 'conta') THEN
        ALTER TABLE "aluno" ADD COLUMN "conta" varchar(30);
    END IF;
END $$;--> statement-breakpoint
-- Add column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'aluno' AND column_name = 'digito_conta') THEN
        ALTER TABLE "aluno" ADD COLUMN "digito_conta" varchar(2);
    END IF;
END $$;