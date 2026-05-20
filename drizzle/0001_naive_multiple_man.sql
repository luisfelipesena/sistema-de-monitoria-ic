-- Add file_id column to inscricao_documento (with IF NOT EXISTS)
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inscricao_documento' AND column_name = 'file_id') THEN
        ALTER TABLE "inscricao_documento" ADD COLUMN "file_id" text NOT NULL;
    END IF;
END $$;