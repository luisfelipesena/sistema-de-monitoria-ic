ALTER TABLE "disciplina" DROP CONSTRAINT "disciplina_codigo_unique";--> statement-breakpoint
ALTER TABLE "curso" ALTER COLUMN "codigo" SET NOT NULL;--> statement-breakpoint
ALTER TABLE "departamento" ALTER COLUMN "unidade_universitaria" SET NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX "codigo_unico_por_departamento_idx" ON "disciplina" USING btree ("codigo","departamento_id");