-- Add column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'periodo_inscricao' AND column_name = 'total_bolsas_prograd') THEN
        ALTER TABLE "periodo_inscricao" ADD COLUMN "total_bolsas_prograd" integer DEFAULT 0;
    END IF;
END $$;