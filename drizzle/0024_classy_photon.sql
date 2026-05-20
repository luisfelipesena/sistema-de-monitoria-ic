-- Add enum value if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'WAITING_LIST' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'status_inscricao_enum')) THEN
        ALTER TYPE "public"."status_inscricao_enum" ADD VALUE 'WAITING_LIST';
    END IF;
END $$;