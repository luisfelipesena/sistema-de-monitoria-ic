CREATE TABLE IF NOT EXISTS "api_key" (
	"id" serial PRIMARY KEY NOT NULL,
	"key_value" varchar(64) NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"user_id" integer NOT NULL,
	"is_active" boolean DEFAULT true NOT NULL,
	"expires_at" timestamp with time zone,
	"last_used_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "api_key_key_value_unique" UNIQUE("key_value")
);
--> statement-breakpoint
-- Add constraint if not exists
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'api_key_user_id_user_id_fk') THEN
        ALTER TABLE "api_key" ADD CONSTRAINT "api_key_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
    END IF;
END $$;