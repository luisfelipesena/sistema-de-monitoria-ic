CREATE TABLE "equivalencia_disciplinas" (
	"id" serial PRIMARY KEY NOT NULL,
	"disciplina_origem_id" integer NOT NULL,
	"disciplina_equivalente_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "equivalencia_disciplinas" ADD CONSTRAINT "equivalencia_disciplinas_disciplina_origem_id_disciplina_id_fk" FOREIGN KEY ("disciplina_origem_id") REFERENCES "public"."disciplina"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "equivalencia_disciplinas" ADD CONSTRAINT "equivalencia_disciplinas_disciplina_equivalente_id_disciplina_id_fk" FOREIGN KEY ("disciplina_equivalente_id") REFERENCES "public"."disciplina"("id") ON DELETE cascade ON UPDATE no action;