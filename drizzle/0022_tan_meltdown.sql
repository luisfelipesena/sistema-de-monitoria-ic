-- Add column if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'disciplina' AND column_name = 'turma') THEN
        ALTER TABLE "disciplina" ADD COLUMN "turma" varchar DEFAULT 'T1' NOT NULL;
    END IF;
END $$;