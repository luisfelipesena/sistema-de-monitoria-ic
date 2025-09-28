CREATE TYPE "public"."tipo_edital_enum" AS ENUM('DCC', 'PROGRAD');--> statement-breakpoint
ALTER TABLE "edital" ADD COLUMN "tipo" "tipo_edital_enum" DEFAULT 'DCC' NOT NULL;--> statement-breakpoint
ALTER TABLE "edital" ADD COLUMN "file_id_prograd_original" text;