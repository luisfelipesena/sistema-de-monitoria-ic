ALTER TABLE "equivalencia_disciplinas" RENAME TO "disc_equiv";--> statement-breakpoint
ALTER TABLE "disc_equiv" RENAME COLUMN "disciplina_origem_id" TO "disc_origem_id";--> statement-breakpoint
ALTER TABLE "disc_equiv" RENAME COLUMN "disciplina_equivalente_id" TO "disc_equiv_id";--> statement-breakpoint
ALTER TABLE "disc_equiv" DROP CONSTRAINT "equivalencia_disciplinas_disciplina_origem_id_disciplina_id_fk";
--> statement-breakpoint
ALTER TABLE "disc_equiv" DROP CONSTRAINT "equivalencia_disciplinas_disciplina_equivalente_id_disciplina_id_fk";
--> statement-breakpoint
ALTER TABLE "disc_equiv" ADD CONSTRAINT "disc_equiv_disc_origem_id_disciplina_id_fk" FOREIGN KEY ("disc_origem_id") REFERENCES "public"."disciplina"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disc_equiv" ADD CONSTRAINT "disc_equiv_disc_equiv_id_disciplina_id_fk" FOREIGN KEY ("disc_equiv_id") REFERENCES "public"."disciplina"("id") ON DELETE cascade ON UPDATE no action;