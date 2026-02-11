-- Migration 0056: Cleanup duplicate projects in production
-- Context: Professor Rubis imported the DCC planilha 4 times due to errors,
-- creating 4 copies of each project. This migration soft-deletes duplicates,
-- keeping only the most recent project per (professor + discipline + ano + semestre).

WITH duplicados AS (
  SELECT p.id,
    ROW_NUMBER() OVER (
      PARTITION BY p.professor_responsavel_id, pd.disciplina_id, p.ano, p.semestre
      ORDER BY p.id DESC
    ) AS rn
  FROM projeto p
  JOIN projeto_disciplina pd ON pd.projeto_id = p.id
  WHERE p.deleted_at IS NULL
)
UPDATE projeto
SET deleted_at = NOW(), updated_at = NOW()
WHERE id IN (SELECT id FROM duplicados WHERE rn > 1);
