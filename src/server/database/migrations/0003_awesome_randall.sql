ALTER TYPE "public"."projeto_status_enum" ADD VALUE 'PENDING_PROFESSOR_SIGNATURE';--> statement-breakpoint
ALTER TABLE "aluno" ADD COLUMN "historico_escolar_file_id" text;--> statement-breakpoint
ALTER TABLE "aluno" ADD COLUMN "comprovante_matricula_file_id" text;