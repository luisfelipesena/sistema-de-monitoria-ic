CREATE TYPE "public"."tipo_documento_inscricao_enum" AS ENUM('RG', 'CPF', 'HISTORICO_ESCOLAR', 'COMPROVANTE_MATRICULA', 'ANEXO_III_BOLSISTA', 'ANEXO_IV_VOLUNTARIO', 'ANEXO_I_TERMO_COMPROMISSO', 'COMPROVANTE_INSCRICAO_COMBINADO');--> statement-breakpoint
-- Normalize legacy free-text tipo_documento values to fit the new enum.
-- Historically the only value observed in practice was 'HISTORICO_ESCOLAR'; we coerce unknowns to the same default to avoid cast failure.
UPDATE "inscricao_documento"
SET "tipo_documento" = 'HISTORICO_ESCOLAR'
WHERE "tipo_documento" NOT IN ('RG', 'CPF', 'HISTORICO_ESCOLAR', 'COMPROVANTE_MATRICULA', 'ANEXO_III_BOLSISTA', 'ANEXO_IV_VOLUNTARIO', 'ANEXO_I_TERMO_COMPROMISSO', 'COMPROVANTE_INSCRICAO_COMBINADO');--> statement-breakpoint
ALTER TABLE "inscricao_documento" ALTER COLUMN "tipo_documento" SET DATA TYPE "public"."tipo_documento_inscricao_enum" USING "tipo_documento"::"public"."tipo_documento_inscricao_enum";--> statement-breakpoint
ALTER TABLE "aluno" ADD COLUMN "telefone_fixo" varchar;--> statement-breakpoint
ALTER TABLE "aluno" ADD COLUMN "data_nascimento" date;--> statement-breakpoint
ALTER TABLE "inscricao_documento" ADD COLUMN "assinado_por_user_id" integer;--> statement-breakpoint
ALTER TABLE "inscricao" ADD COLUMN "cursou_componente" boolean;--> statement-breakpoint
ALTER TABLE "inscricao" ADD COLUMN "disciplina_equivalente_id" integer;--> statement-breakpoint
ALTER TABLE "inscricao" ADD COLUMN "assinatura_aluno_file_id" text;--> statement-breakpoint
ALTER TABLE "inscricao" ADD COLUMN "data_assinatura_aluno" timestamp with time zone;--> statement-breakpoint
ALTER TABLE "inscricao" ADD COLUMN "local_assinatura_aluno" varchar(120);--> statement-breakpoint
ALTER TABLE "inscricao_documento" ADD CONSTRAINT "inscricao_documento_assinado_por_user_id_user_id_fk" FOREIGN KEY ("assinado_por_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inscricao" ADD CONSTRAINT "inscricao_disciplina_equivalente_id_disciplina_id_fk" FOREIGN KEY ("disciplina_equivalente_id") REFERENCES "public"."disciplina"("id") ON DELETE no action ON UPDATE no action;