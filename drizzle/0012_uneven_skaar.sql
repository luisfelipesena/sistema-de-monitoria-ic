-- Add column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projeto' AND column_name = 'assinatura_professor') THEN
        ALTER TABLE "projeto" ADD COLUMN "assinatura_professor" text;
    END IF;
END $$;