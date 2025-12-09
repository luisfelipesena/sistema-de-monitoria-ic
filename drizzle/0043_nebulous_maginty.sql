DROP INDEX "codigo_unico_por_departamento_idx";--> statement-breakpoint
CREATE UNIQUE INDEX "codigo_departamento_idx" ON "disciplina" USING btree ("codigo","departamento_id");--> statement-breakpoint
ALTER TABLE "disciplina" DROP COLUMN "turma";