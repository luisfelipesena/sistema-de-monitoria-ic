-- Add column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'edital' AND column_name = 'valor_bolsa') THEN
        ALTER TABLE "edital" ADD COLUMN "valor_bolsa" numeric(10, 2) DEFAULT '400.00' NOT NULL;
    END IF;
END $$;