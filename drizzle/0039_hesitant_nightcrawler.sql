CREATE TYPE "public"."audit_action_enum" AS ENUM('CREATE', 'UPDATE', 'DELETE', 'APPROVE', 'REJECT', 'SUBMIT', 'SIGN', 'LOGIN', 'LOGOUT', 'SEND_NOTIFICATION', 'PUBLISH', 'SELECT', 'ACCEPT');--> statement-breakpoint
CREATE TYPE "public"."audit_entity_enum" AS ENUM('PROJETO', 'INSCRICAO', 'EDITAL', 'RELATORIO', 'VAGA', 'USER', 'PROFESSOR', 'ALUNO', 'NOTIFICATION');--> statement-breakpoint
CREATE TABLE "audit_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer,
	"action" "audit_action_enum" NOT NULL,
	"entity_type" "audit_entity_enum" NOT NULL,
	"entity_id" integer,
	"details" text,
	"ip_address" varchar(45),
	"user_agent" text,
	"timestamp" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "audit_log" ADD CONSTRAINT "audit_log_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "audit_log_user_idx" ON "audit_log" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "audit_log_entity_idx" ON "audit_log" USING btree ("entity_type","entity_id");--> statement-breakpoint
CREATE INDEX "audit_log_timestamp_idx" ON "audit_log" USING btree ("timestamp");--> statement-breakpoint
CREATE INDEX "relatorio_monitor_pending_signature_idx" ON "relatorio_final_monitor" USING btree ("status","aluno_assinou_em","inscricao_id");