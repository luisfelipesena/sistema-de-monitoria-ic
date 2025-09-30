LTER TABLE "aluno" ALTER COLUMN "genero" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "aluno" ALTER COLUMN "email_institucional" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "aluno" ALTER COLUMN "matricula" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "aluno" ALTER COLUMN "cpf" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "aluno" ALTER COLUMN "CR" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "aluno" ALTER COLUMN "curso_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "professor" ALTER COLUMN "departamento_id" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "professor" ALTER COLUMN "matricula_siape" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "professor" ALTER COLUMN "genero" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "professor" ALTER COLUMN "regime" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "professor" ALTER COLUMN "cpf" DROP NOT NULL;--> statement-breakpoint
ALTER TABLE "professor" ALTER COLUMN "email_institucional" DROP NOT NULL;