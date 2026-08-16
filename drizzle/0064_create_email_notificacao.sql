CREATE TABLE IF NOT EXISTS "email_notificacao" (
  "id" serial PRIMARY KEY NOT NULL,
  "nome" varchar(255) NOT NULL,
  "email" text NOT NULL,
  "descricao" text,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL,
  "updated_at" timestamp with time zone
);
