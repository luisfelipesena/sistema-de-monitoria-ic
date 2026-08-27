CREATE TABLE "consolidacao_prograd_assinatura" (
	"id" serial PRIMARY KEY NOT NULL,
	"ano" integer NOT NULL,
	"semestre" "semestre_enum" NOT NULL,
	"chefe_email" varchar(255),
	"chefe_nome" varchar(255),
	"chefe_assinatura" text,
	"chefe_assinou_em" timestamp with time zone,
	"chefe_departamento_id" integer,
	"signature_token" varchar(255),
	"signature_token_expires_at" timestamp with time zone,
	"pdf_file_id" text,
	"requested_by_user_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "consolidacao_prograd_assinatura_signature_token_unique" UNIQUE("signature_token")
);
--> statement-breakpoint
ALTER TABLE "consolidacao_prograd_assinatura" ADD CONSTRAINT "consolidacao_prograd_assinatura_chefe_departamento_id_professor_id_fk" FOREIGN KEY ("chefe_departamento_id") REFERENCES "public"."professor"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "consolidacao_prograd_assinatura" ADD CONSTRAINT "consolidacao_prograd_assinatura_requested_by_user_id_user_id_fk" FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;