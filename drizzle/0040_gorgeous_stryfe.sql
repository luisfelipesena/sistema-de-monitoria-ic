CREATE TYPE "public"."edital_signature_token_status_enum" AS ENUM('PENDING', 'USED', 'EXPIRED');--> statement-breakpoint
CREATE TABLE "edital_signature_token" (
	"id" serial PRIMARY KEY NOT NULL,
	"edital_id" integer NOT NULL,
	"token" varchar(255) NOT NULL,
	"chefe_email" varchar(255) NOT NULL,
	"chefe_nome" varchar(255),
	"status" "edital_signature_token_status_enum" DEFAULT 'PENDING' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"used_at" timestamp with time zone,
	"requested_by_user_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "edital_signature_token_token_unique" UNIQUE("token")
);
--> statement-breakpoint
ALTER TABLE "edital_signature_token" ADD CONSTRAINT "edital_signature_token_edital_id_edital_id_fk" FOREIGN KEY ("edital_id") REFERENCES "public"."edital"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edital_signature_token" ADD CONSTRAINT "edital_signature_token_requested_by_user_id_user_id_fk" FOREIGN KEY ("requested_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;