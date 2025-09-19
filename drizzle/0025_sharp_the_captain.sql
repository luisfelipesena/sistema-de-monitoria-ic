ALTER TABLE "professor" ALTER COLUMN "matricula_siape" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "projeto" DROP COLUMN "assinatura_admin";--> statement-breakpoint
-- Convert PENDING_ADMIN_SIGNATURE to SUBMITTED before dropping the enum
UPDATE "public"."projeto" SET "status" = 'SUBMITTED' WHERE "status" = 'PENDING_ADMIN_SIGNATURE';--> statement-breakpoint
ALTER TABLE "public"."projeto" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
DROP TYPE "public"."projeto_status_enum" CASCADE;--> statement-breakpoint
CREATE TYPE "public"."projeto_status_enum" AS ENUM('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'PENDING_PROFESSOR_SIGNATURE');--> statement-breakpoint
ALTER TABLE "public"."projeto" ALTER COLUMN "status" SET DATA TYPE "public"."projeto_status_enum" USING "status"::"public"."projeto_status_enum";