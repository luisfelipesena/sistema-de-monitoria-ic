-- Add configuracao_sistema table for system-level configuration (e.g., IC email)
CREATE TABLE IF NOT EXISTS "configuracao_sistema" (
  "id" serial PRIMARY KEY NOT NULL,
  "chave" varchar(100) NOT NULL UNIQUE,
  "valor" text,
  "descricao" text,
  "updated_at" timestamp with time zone,
  "created_at" timestamp with time zone DEFAULT now() NOT NULL
);

-- Seed initial IC email configuration
INSERT INTO "configuracao_sistema" ("chave", "valor", "descricao")
VALUES ('EMAIL_INSTITUTO_COMPUTACAO', NULL, 'Email do Instituto de Computação para envio da planilha PROGRAD');
