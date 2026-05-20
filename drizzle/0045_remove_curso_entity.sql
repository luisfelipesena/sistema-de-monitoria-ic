-- Migration: Remove Curso entity
-- Replace curso_id foreign key with curso_nome text field

-- Step 1: Add the new curso_nome column
ALTER TABLE "aluno" ADD COLUMN "curso_nome" varchar(255);

-- Step 2: Migrate existing data - copy curso name from curso table
UPDATE "aluno"
SET "curso_nome" = (SELECT "nome" FROM "curso" WHERE "curso"."id" = "aluno"."curso_id")
WHERE "curso_id" IS NOT NULL;

-- Step 3: Drop the foreign key constraint and column
ALTER TABLE "aluno" DROP COLUMN IF EXISTS "curso_id";

-- Step 4: Drop the curso table
DROP TABLE IF EXISTS "curso";

-- Step 5: Drop the curso enums
DROP TYPE IF EXISTS "tipo_curso_enum";
DROP TYPE IF EXISTS "modalidade_curso_enum";
DROP TYPE IF EXISTS "status_curso_enum";
