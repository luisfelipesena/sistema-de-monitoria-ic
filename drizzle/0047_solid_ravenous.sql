-- Professor types and account status
CREATE TYPE "public"."professor_account_status_enum" AS ENUM('PENDING', 'ACTIVE', 'INACTIVE');--> statement-breakpoint
CREATE TYPE "public"."tipo_professor_enum" AS ENUM('SUBSTITUTO', 'EFETIVO');--> statement-breakpoint

-- Add new columns to professor table
ALTER TABLE "professor" ADD COLUMN "tipo_professor" "tipo_professor_enum" DEFAULT 'EFETIVO' NOT NULL;--> statement-breakpoint
ALTER TABLE "professor" ADD COLUMN "account_status" "professor_account_status_enum" DEFAULT 'ACTIVE' NOT NULL;--> statement-breakpoint

-- Extend professor_invitation table with new fields for pre-creating professor
ALTER TABLE "professor_invitation" ADD COLUMN "nome_completo" varchar(255);--> statement-breakpoint
ALTER TABLE "professor_invitation" ADD COLUMN "departamento_id" integer;--> statement-breakpoint
ALTER TABLE "professor_invitation" ADD COLUMN "regime" "regime_enum";--> statement-breakpoint
ALTER TABLE "professor_invitation" ADD COLUMN "tipo_professor" "tipo_professor_enum" DEFAULT 'EFETIVO';--> statement-breakpoint
ALTER TABLE "professor_invitation" ADD COLUMN "professor_id" integer;--> statement-breakpoint
ALTER TABLE "professor_invitation" ADD CONSTRAINT "professor_invitation_departamento_id_departamento_id_fk" FOREIGN KEY ("departamento_id") REFERENCES "public"."departamento"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "professor_invitation" ADD CONSTRAINT "professor_invitation_professor_id_professor_id_fk" FOREIGN KEY ("professor_id") REFERENCES "public"."professor"("id") ON DELETE no action ON UPDATE no action;