-- Make departamento_id nullable on projeto table to allow cascade deletion of departamentos
ALTER TABLE "projeto" ALTER COLUMN "departamento_id" DROP NOT NULL;
