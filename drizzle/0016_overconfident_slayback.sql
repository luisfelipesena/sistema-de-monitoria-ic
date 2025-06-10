ALTER TABLE "professor" ADD COLUMN "assinatura_default" text;--> statement-breakpoint
ALTER TABLE "professor" ADD COLUMN "data_assinatura_default" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "assinatura_default" text;--> statement-breakpoint
ALTER TABLE "user" ADD COLUMN "data_assinatura_default" timestamp with time zone;