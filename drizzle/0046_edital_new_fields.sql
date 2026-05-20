-- Add new fields to edital table for selection dates and form link
ALTER TABLE "edital" ADD COLUMN "data_inicio_selecao" date;--> statement-breakpoint
ALTER TABLE "edital" ADD COLUMN "data_fim_selecao" date;--> statement-breakpoint
ALTER TABLE "edital" ADD COLUMN "link_formulario_inscricao" text;--> statement-breakpoint

-- Rename fileIdProgradOriginal to fileIdPdfExterno (more generic name)
ALTER TABLE "edital" RENAME COLUMN "file_id_prograd_original" TO "file_id_pdf_externo";
