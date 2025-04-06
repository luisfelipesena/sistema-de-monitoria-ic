CREATE TYPE "semestre_enum" AS ENUM (
  'SEMESTRE_1',
  'SEMESTRE_2'
);

CREATE TYPE "tipo_proposicao_enum" AS ENUM (
  'INDIVIDUAL',
  'COLETIVA'
);

CREATE TYPE "tipo_vaga_enum" AS ENUM (
  'BOLSISTA',
  'VOLUNTARIO'
);

CREATE TYPE "projeto_status_enum" AS ENUM (
  'SUBMETIDO',
  'APROVADO',
  'REPROVADO'
);

CREATE TYPE "genero_enum" AS ENUM (
  'M',
  'F',
  'OUTRO'
);

CREATE TYPE "regime_enum" AS ENUM (
  '20H',
  '40H',
  'DE'
);

CREATE TYPE "tipo_inscricao_enum" AS ENUM (
  'BOLSISTA',
  'VOLUNTARIO',
  'QUALQUER'
);

CREATE TYPE "status_inscricao_enum" AS ENUM (
  'SUBMETIDO',
  'INAPTO',
  'APTO',
  'SELECIONADO_BOLSISTA',
  'SELECIONADO_VOLUNTARIO',
  'APROVACAO_CONFIRMADA_BOLSISTA',
  'APROVACAO_CONFIRMADA_VOLUNTARIO'
);

CREATE TABLE "departamento" (
  "id" integer PRIMARY KEY,
  "unidade_universitaria" varchar,
  "nome" varchar,
  "sigla" varchar,
  "created_at" timestamp
);

CREATE TABLE "projeto" (
  "id" integer PRIMARY KEY,
  "data_aprovacao" date,
  "departamento_id" integer NOT NULL,
  "ano" integer NOT NULL,
  "semestre" semestre_enum NOT NULL,
  "tipo_proposicao" tipo_proposicao_enum NOT NULL,
  "bolsas_solicitadas" integer NOT NULL,
  "voluntarios_solicitados" integer NOT NULL,
  "bolsas_atendidas" integer,
  "voluntarios_atendidos" integer,
  "carga_horaria_semana" integer NOT NULL,
  "numero_semanas" integer NOT NULL,
  "publico_alvo" varchar NOT NULL,
  "estimativa_pessoas_beneficiadas" integer,
  "professor_responsavel_id" integer NOT NULL,
  "descricao" text NOT NULL,
  "status" projeto_status_enum NOT NULL,
  "analise_submissao" text,
  "documento" blob,
  "assinatura" blob,
  "validado" bool NOT NULL DEFAULT false,
  "created_at" timestamp,
  "updated_at" timestamp,
  "deleted_at" timestamp
);

CREATE TABLE "projeto_disciplina" (
  "id" integer PRIMARY KEY,
  "projeto_id" integer NOT NULL,
  "disciplina_id" integer NOT NULL,
  "created_at" timestamp,
  "deleted_at" timestamp
);

CREATE TABLE "projeto_professor" (
  "id" integer PRIMARY KEY,
  "projeto_id" integer NOT NULL,
  "professor_id" integer NOT NULL,
  "created_at" timestamp,
  "deleted_at" timestamp
);

CREATE TABLE "atividade_projeto" (
  "id" integer PRIMARY KEY,
  "projeto_id" integer NOT NULL,
  "descricao" text NOT NULL,
  "created_at" timestamp,
  "deleted_at" timestamp
);

CREATE TABLE "professor" (
  "id" integer PRIMARY KEY,
  "departamento_id" integer NOT NULL,
  "nome_completo" varchar NOT NULL,
  "nome_social" varchar,
  "matricula_siape" varchar NOT NULL,
  "genero" genero_enum NOT NULL,
  "regime" regime_enum NOT NULL,
  "especificacao_genero" varchar,
  "cpf" varchar NOT NULL,
  "telefone" varchar,
  "telefone_institucional" varchar,
  "email_institucional" varchar NOT NULL,
  "created_at" timestamp,
  "updated_at" timestamp,
  "deleted_at" timestamp
);

CREATE TABLE "disciplina" (
  "id" integer PRIMARY KEY,
  "nome" varchar,
  "codigo" varchar,
  "created_at" timestamp,
  "updated_at" timestamp
);

CREATE TABLE "aluno" (
  "id" integer PRIMARY KEY,
  "nome_completo" varchar NOT NULL,
  "nome_social" varchar,
  "genero" genero_enum NOT NULL,
  "especificacao_genero" varchar,
  "email_institucional" varchar NOT NULL,
  "matricula" varchar NOT NULL,
  "rg" varchar NOT NULL,
  "cpf" varchar NOT NULL,
  "CR" float NOT NULL,
  "telefone" varchar,
  "endereco_id" integer,
  "curso_id" integer NOT NULL,
  "created_at" timestamp,
  "updated_at" timestamp,
  "deleted_at" timestamp
);

CREATE TABLE "endereco" (
  "id" integer PRIMARY KEY,
  "numero" integer,
  "rua" varchar NOT NULL,
  "bairro" varchar NOT NULL,
  "cidade" varchar NOT NULL,
  "estado" varchar NOT NULL,
  "cep" varchar NOT NULL,
  "complemento" varchar,
  "created_at" timestamp,
  "updated_at" timestamp,
  "deleted_at" timestamp
);

CREATE TABLE "curso" (
  "id" integer PRIMARY KEY,
  "nome" varchar NOT NULL,
  "codigo" integer,
  "created_at" timestamp,
  "updated_at" timestamp
);

CREATE TABLE "nota_aluno" (
  "id" integer PRIMARY KEY,
  "aluno_id" integer NOT NULL,
  "codigo_disciplina" varchar NOT NULL,
  "nota" float NOT NULL,
  "ano" integer NOT NULL,
  "semestre" semestre_enum NOT NULL,
  "created_at" timestamp,
  "updated_at" timestamp,
  "deleted_at" timestamp
);

CREATE TABLE "processo_seletivo" (
  "id" integer PRIMARY KEY,
  "projeto_id" integer NOT NULL,
  "vagas_bolsista" integer NOT NULL,
  "vagas_voluntario" integer NOT NULL,
  "edital" blob,
  "data_inicio" date NOT NULL,
  "data_final" date NOT NULL,
  "created_at" timestamp,
  "updated_at" timestamp,
  "deleted_at" timestamp
);

CREATE TABLE "inscricao" (
  "id" integer PRIMARY KEY,
  "processo_seletivo_id" integer NOT NULL,
  "aluno_id" integer NOT NULL,
  "tipo" tipo_inscricao_enum,
  "status" status_inscricao_enum NOT NULL,
  "nota_prova" float,
  "created_at" timestamp,
  "updated_at" timestamp,
  "deleted_at" timestamp
);

CREATE TABLE "inscricao_documento" (
  "id" integer PRIMARY KEY,
  "inscricao_id" integer NOT NULL,
  "documento" blob NOT NULL,
  "validado" bool,
  "created_at" timestamp,
  "updated_at" timestamp,
  "deleted_at" timestamp
);

CREATE TABLE "vaga" (
  "id" integer PRIMARY KEY,
  "aluno_id" integer NOT NULL,
  "projeto_id" integer NOT NULL,
  "tipo" tipo_vaga_enum NOT NULL,
  "created_at" timestamp,
  "updated_at" timestamp,
  "deleted_at" timestamp
);

ALTER TABLE "projeto" ADD CONSTRAINT "projeto_departamento" FOREIGN KEY ("departamento_id") REFERENCES "departamento" ("id");

ALTER TABLE "projeto_disciplina" ADD CONSTRAINT "projeto_disciplina_1" FOREIGN KEY ("projeto_id") REFERENCES "projeto" ("id");

ALTER TABLE "projeto_disciplina" ADD CONSTRAINT "projeto_disciplina_2" FOREIGN KEY ("disciplina_id") REFERENCES "disciplina" ("id");

ALTER TABLE "projeto_professor" ADD CONSTRAINT "projeto_professor_1" FOREIGN KEY ("projeto_id") REFERENCES "projeto" ("id");

ALTER TABLE "projeto_professor" ADD CONSTRAINT "projeto_professor_2" FOREIGN KEY ("professor_id") REFERENCES "professor" ("id");

ALTER TABLE "atividade_projeto" ADD CONSTRAINT "atividade_projeto_1" FOREIGN KEY ("projeto_id") REFERENCES "projeto" ("id");

ALTER TABLE "professor" ADD CONSTRAINT "professor_departamento" FOREIGN KEY ("departamento_id") REFERENCES "departamento" ("id");

ALTER TABLE "aluno" ADD CONSTRAINT "aluno_endereco" FOREIGN KEY ("endereco_id") REFERENCES "endereco" ("id");

ALTER TABLE "aluno" ADD CONSTRAINT "aluno_curso" FOREIGN KEY ("curso_id") REFERENCES "curso" ("id");

ALTER TABLE "nota_aluno" ADD CONSTRAINT "notas_do_aluno" FOREIGN KEY ("aluno_id") REFERENCES "aluno" ("id");

ALTER TABLE "processo_seletivo" ADD CONSTRAINT "processo_seletivo_projeto" FOREIGN KEY ("projeto_id") REFERENCES "projeto" ("id");

ALTER TABLE "inscricao" ADD CONSTRAINT "inscricao_processo_seletivo" FOREIGN KEY ("processo_seletivo_id") REFERENCES "processo_seletivo" ("id");

ALTER TABLE "inscricao" ADD CONSTRAINT "inscricao_aluno" FOREIGN KEY ("aluno_id") REFERENCES "aluno" ("id");

ALTER TABLE "inscricao_documento" ADD CONSTRAINT "inscricao_documento_inscricao" FOREIGN KEY ("inscricao_id") REFERENCES "inscricao" ("id");

ALTER TABLE "vaga" ADD CONSTRAINT "vaga_aluno" FOREIGN KEY ("aluno_id") REFERENCES "aluno" ("id");

ALTER TABLE "vaga" ADD CONSTRAINT "vaga_projeto" FOREIGN KEY ("projeto_id") REFERENCES "projeto" ("id");
