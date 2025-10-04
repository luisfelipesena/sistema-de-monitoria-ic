ALTER TABLE "edital" ADD COLUMN "datas_provas_disponiveis" text;--> statement-breakpoint
ALTER TABLE "edital" ADD COLUMN "data_divulgacao_resultado" date;--> statement-breakpoint
ALTER TABLE "projeto" ADD COLUMN "data_selecao_escolhida" date;--> statement-breakpoint
ALTER TABLE "projeto" ADD COLUMN "horario_selecao" varchar(20);--> statement-breakpoint
ALTER TABLE "projeto_template" ADD COLUMN "pontos_prova_default" text;--> statement-breakpoint
ALTER TABLE "projeto_template" ADD COLUMN "bibliografia_default" text;