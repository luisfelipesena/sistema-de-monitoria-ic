-- Safe migration: only apply changes if they haven't been applied yet

-- Set matricula_siape NOT NULL if not already
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'professor' AND column_name = 'matricula_siape' AND is_nullable = 'YES') THEN
        ALTER TABLE "professor" ALTER COLUMN "matricula_siape" SET NOT NULL;
    END IF;
END $$;--> statement-breakpoint

-- Drop assinatura_admin column if exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'projeto' AND column_name = 'assinatura_admin') THEN
        ALTER TABLE "projeto" DROP COLUMN "assinatura_admin";
    END IF;
END $$;--> statement-breakpoint

-- Ensure enum has correct values (skip if already correct)
DO $$
BEGIN
    -- Convert any old statuses if they exist
    UPDATE "public"."projeto" SET "status" = 'SUBMITTED' WHERE "status" = 'PENDING_ADMIN_SIGNATURE';

    -- Add PENDING_PROFESSOR_SIGNATURE if not exists
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'PENDING_PROFESSOR_SIGNATURE' AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'projeto_status_enum')) THEN
        ALTER TYPE "public"."projeto_status_enum" ADD VALUE 'PENDING_PROFESSOR_SIGNATURE';
    END IF;
END $$;