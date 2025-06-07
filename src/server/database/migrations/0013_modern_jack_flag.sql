ALTER TYPE "public"."tipo_assinatura_enum" ADD VALUE 'PROJETO_COORDENADOR_DEPARTAMENTO';--> statement-breakpoint
ALTER TABLE "inscricao" ADD COLUMN "nota_disciplina" numeric(4, 2);--> statement-breakpoint
ALTER TABLE "inscricao" ADD COLUMN "nota_selecao" numeric(4, 2);--> statement-breakpoint
ALTER TABLE "inscricao" ADD COLUMN "cr" numeric(4, 2);--> statement-breakpoint
ALTER TABLE "inscricao" ADD COLUMN "nota_final" numeric(4, 2);