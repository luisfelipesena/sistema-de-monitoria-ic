-- Add email configuration for professors and students general mailing lists
INSERT INTO "configuracao_sistema" ("chave", "valor", "descricao")
VALUES
  ('EMAIL_GERAL_PROFESSORES', NULL, 'Email geral dos professores para notificação de publicação de edital'),
  ('EMAIL_GERAL_ESTUDANTES', NULL, 'Email geral dos estudantes para notificação de publicação de edital')
ON CONFLICT ("chave") DO NOTHING;
