-- First update any existing PENDING_PROFESSOR_SIGNATURE status to SUBMITTED
UPDATE "projeto" SET "status" = 'SUBMITTED' WHERE "status" = 'PENDING_PROFESSOR_SIGNATURE';--> statement-breakpoint
-- Now alter the enum type
ALTER TABLE "projeto" ALTER COLUMN "status" SET DATA TYPE text;--> statement-breakpoint
ALTER TABLE "projeto" ALTER COLUMN "status" SET DEFAULT 'DRAFT'::text;--> statement-breakpoint
DROP TYPE "public"."projeto_status_enum";--> statement-breakpoint
CREATE TYPE "public"."projeto_status_enum" AS ENUM('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'PENDING_ADMIN_SIGNATURE');--> statement-breakpoint
ALTER TABLE "projeto" ALTER COLUMN "status" SET DEFAULT 'DRAFT'::"public"."projeto_status_enum";--> statement-breakpoint
ALTER TABLE "projeto" ALTER COLUMN "status" SET DATA TYPE "public"."projeto_status_enum" USING "status"::"public"."projeto_status_enum";