CREATE TABLE IF NOT EXISTS "disciplina_professor_responsavel" (
	"id" serial PRIMARY KEY NOT NULL,
	"disciplina_id" integer NOT NULL,
	"professor_id" integer NOT NULL,
	"ano" integer NOT NULL,
	"semestre" "semestre_enum" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
-- Add constraint if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'disciplina_professor_responsavel_disciplina_id_disciplina_id_fk') THEN
        ALTER TABLE "disciplina_professor_responsavel" ADD CONSTRAINT "disciplina_professor_responsavel_disciplina_id_disciplina_id_fk" FOREIGN KEY ("disciplina_id") REFERENCES "public"."disciplina"("id") ON DELETE no action ON UPDATE no action;
    END IF;
END $$;--> statement-breakpoint
-- Add constraint if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'disciplina_professor_responsavel_professor_id_professor_id_fk') THEN
        ALTER TABLE "disciplina_professor_responsavel" ADD CONSTRAINT "disciplina_professor_responsavel_professor_id_professor_id_fk" FOREIGN KEY ("professor_id") REFERENCES "public"."professor"("id") ON DELETE no action ON UPDATE no action;
    END IF;
END $$;