ALTER TABLE "edital" ADD COLUMN "horario_inicio_selecao" varchar(5);--> statement-breakpoint
ALTER TABLE "edital" ADD COLUMN "horario_fim_selecao" varchar(5);--> statement-breakpoint
ALTER TABLE "projeto" ADD COLUMN "datas_selecao_escolhidas" text;