-- Adiciona campos de janela de alteração ao edital
-- Define o período em que professores podem criar/editar/submeter projetos
ALTER TABLE "edital" ADD COLUMN "data_inicio_alteracao" timestamp with time zone;
ALTER TABLE "edital" ADD COLUMN "data_fim_alteracao" timestamp with time zone;
