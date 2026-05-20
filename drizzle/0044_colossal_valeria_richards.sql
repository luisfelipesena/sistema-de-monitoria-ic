-- Create admin_type_enum
CREATE TYPE "public"."admin_type_enum" AS ENUM('DCC', 'DCI');--> statement-breakpoint

-- Add admin_type column to user table
ALTER TABLE "user" ADD COLUMN "admin_type" "admin_type_enum";--> statement-breakpoint

-- Update tipo_edital_enum: add DCI value (PROGRAD will be replaced by DCI)
-- First, add DCI to the enum
ALTER TYPE "public"."tipo_edital_enum" ADD VALUE IF NOT EXISTS 'DCI';--> statement-breakpoint

-- Update any existing PROGRAD values to DCI (if there are any)
UPDATE "edital" SET "tipo" = 'DCC' WHERE "tipo" = 'PROGRAD';--> statement-breakpoint

-- Remove default on tipo column temporarily
ALTER TABLE "edital" ALTER COLUMN "tipo" DROP DEFAULT;--> statement-breakpoint

-- Convert column to text, recreate enum without PROGRAD, convert back
ALTER TABLE "edital" ALTER COLUMN "tipo" SET DATA TYPE text USING "tipo"::text;--> statement-breakpoint

-- Drop old enum type
DROP TYPE "public"."tipo_edital_enum";--> statement-breakpoint

-- Recreate without PROGRAD
CREATE TYPE "public"."tipo_edital_enum" AS ENUM('DCC', 'DCI');--> statement-breakpoint

-- Convert column back to enum
ALTER TABLE "edital" ALTER COLUMN "tipo" SET DATA TYPE "public"."tipo_edital_enum" USING "tipo"::"public"."tipo_edital_enum";--> statement-breakpoint

-- Re-add default
ALTER TABLE "edital" ALTER COLUMN "tipo" SET DEFAULT 'DCC';
