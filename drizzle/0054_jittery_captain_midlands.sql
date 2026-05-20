ALTER TYPE "public"."projeto_status_enum" ADD VALUE 'PENDING_REVISION';--> statement-breakpoint
ALTER TABLE "projeto" ADD COLUMN "mensagem_revisao" text;--> statement-breakpoint
ALTER TABLE "projeto" ADD COLUMN "revisao_solicitada_em" timestamp with time zone;