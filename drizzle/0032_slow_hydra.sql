-- Add column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'edital' AND column_name = 'datas_provas_disponiveis') THEN
        ALTER TABLE "edital" ADD COLUMN "datas_provas_disponiveis" text;
    END IF;
END $$;--> statement-breakpoint
-- Add column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'edital' AND column_name = 'data_divulgacao_resultado') THEN
        ALTER TABLE "edital" ADD COLUMN "data_divulgacao_resultado" date;
    END IF;
END $$;--> statement-breakpoint
-- Add column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projeto' AND column_name = 'data_selecao_escolhida') THEN
        ALTER TABLE "projeto" ADD COLUMN "data_selecao_escolhida" date;
    END IF;
END $$;--> statement-breakpoint
-- Add column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projeto' AND column_name = 'horario_selecao') THEN
        ALTER TABLE "projeto" ADD COLUMN "horario_selecao" varchar(20);
    END IF;
END $$;--> statement-breakpoint
-- Add column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projeto_template' AND column_name = 'pontos_prova_default') THEN
        ALTER TABLE "projeto_template" ADD COLUMN "pontos_prova_default" text;
    END IF;
END $$;--> statement-breakpoint
-- Add column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projeto_template' AND column_name = 'bibliografia_default') THEN
        ALTER TABLE "projeto_template" ADD COLUMN "bibliografia_default" text;
    END IF;
END $$;