CREATE TABLE "disciplina_professor_responsavel" (
	"id" serial PRIMARY KEY NOT NULL,
	"disciplina_id" integer NOT NULL,
	"professor_id" integer NOT NULL,
	"ano" integer NOT NULL,
	"semestre" "semestre_enum" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "disciplina_professor_responsavel" ADD CONSTRAINT "disciplina_professor_responsavel_disciplina_id_disciplina_id_fk" FOREIGN KEY ("disciplina_id") REFERENCES "public"."disciplina"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disciplina_professor_responsavel" ADD CONSTRAINT "disciplina_professor_responsavel_professor_id_professor_id_fk" FOREIGN KEY ("professor_id") REFERENCES "public"."professor"("id") ON DELETE no action ON UPDATE no action;