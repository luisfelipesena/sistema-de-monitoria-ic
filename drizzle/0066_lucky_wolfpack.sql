DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'edital' AND column_name = 'file_id_prograd_original'
  ) AND NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'edital' AND column_name = 'file_id_pdf_externo'
  ) THEN
    ALTER TABLE "edital" RENAME COLUMN "file_id_prograd_original" TO "file_id_pdf_externo";
  END IF;
END $$;
--> statement-breakpoint
ALTER TABLE "edital" ADD COLUMN IF NOT EXISTS "file_id_pdf_externo" text;
--> statement-breakpoint
ALTER TABLE "edital" ADD COLUMN IF NOT EXISTS "data_inicio_selecao" date;
--> statement-breakpoint
ALTER TABLE "edital" ADD COLUMN IF NOT EXISTS "data_fim_selecao" date;
--> statement-breakpoint
ALTER TABLE "edital" ADD COLUMN IF NOT EXISTS "link_formulario_inscricao" text;
--> statement-breakpoint
ALTER TABLE "projeto" ALTER COLUMN "status" SET DATA TYPE text;
--> statement-breakpoint
ALTER TABLE "projeto" ALTER COLUMN "status" SET DEFAULT 'DRAFT'::text;
--> statement-breakpoint
DROP TYPE "public"."projeto_status_enum";
--> statement-breakpoint
CREATE TYPE "public"."projeto_status_enum" AS ENUM(
  'DRAFT',
  'SUBMITTED',
  'APPROVED',
  'REJECTED',
  'PENDING_PROFESSOR_SIGNATURE',
  'PENDING_REVISION'
);
--> statement-breakpoint
ALTER TABLE "projeto" ALTER COLUMN "status" SET DEFAULT 'DRAFT'::"public"."projeto_status_enum";
--> statement-breakpoint
ALTER TABLE "projeto" ALTER COLUMN "status" SET DATA TYPE "public"."projeto_status_enum"
  USING "status"::"public"."projeto_status_enum";
--> statement-breakpoint
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'configuracao_sistema_chave_key'
  ) AND NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'configuracao_sistema_chave_unique'
  ) THEN
    ALTER TABLE "configuracao_sistema"
      RENAME CONSTRAINT "configuracao_sistema_chave_key" TO "configuracao_sistema_chave_unique";
  END IF;
END $$;
--> statement-breakpoint
ALTER TABLE "assinatura_documento"
  DROP CONSTRAINT IF EXISTS "assinatura_documento_edital_id_edital_id_fk";
--> statement-breakpoint
ALTER TABLE "assinatura_documento"
  ADD CONSTRAINT "assinatura_documento_edital_id_edital_id_fk"
  FOREIGN KEY ("edital_id") REFERENCES "public"."edital"("id") ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE "projeto"
  DROP CONSTRAINT IF EXISTS "projeto_edital_interno_id_edital_id_fk";
--> statement-breakpoint
ALTER TABLE "projeto"
  ADD CONSTRAINT "projeto_edital_interno_id_edital_id_fk"
  FOREIGN KEY ("edital_interno_id") REFERENCES "public"."edital"("id") ON DELETE set null ON UPDATE no action;
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "aluno_cpf_normalized_unique"
  ON "aluno" USING btree (regexp_replace("cpf", '\D', '', 'g'))
  WHERE "aluno"."cpf" IS NOT NULL
    AND length(regexp_replace("aluno"."cpf", '\D', '', 'g')) = 11;
