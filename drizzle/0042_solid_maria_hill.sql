CREATE TABLE "reminder_execution_log" (
	"id" serial PRIMARY KEY NOT NULL,
	"reminder_type" varchar(100) NOT NULL,
	"executed_at" timestamp with time zone DEFAULT now() NOT NULL,
	"executed_by_user_id" integer,
	"is_proactive" boolean DEFAULT false NOT NULL,
	"notifications_sent" integer DEFAULT 0 NOT NULL,
	"details" text,
	"created_at" timestamp with time zone DEFAULT now()
);
--> statement-breakpoint
ALTER TABLE "reminder_execution_log" ADD CONSTRAINT "reminder_execution_log_executed_by_user_id_user_id_fk" FOREIGN KEY ("executed_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "idx_reminder_execution_type_date" ON "reminder_execution_log" USING btree ("reminder_type","executed_at");