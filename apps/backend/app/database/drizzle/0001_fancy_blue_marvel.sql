CREATE TYPE "public"."genero_enum" AS ENUM('MASCULINO', 'FEMININO', 'OUTRO');--> statement-breakpoint
CREATE TYPE "public"."projeto_status_enum" AS ENUM('SUBMETIDO', 'APROVADO', 'REPROVADO');--> statement-breakpoint
CREATE TYPE "public"."regime_enum" AS ENUM('20H', '40H', 'DE');--> statement-breakpoint
CREATE TYPE "public"."semestre_enum" AS ENUM('SEMESTRE_1', 'SEMESTRE_2');--> statement-breakpoint
CREATE TYPE "public"."status_inscricao_enum" AS ENUM('SUBMETIDO', 'INAPTO', 'APTO', 'SELECIONADO_BOLSISTA', 'SELECIONADO_VOLUNTARIO', 'APROVACAO_CONFIRMADA_BOLSISTA', 'APROVACAO_CONFIRMADA_VOLUNTARIO');--> statement-breakpoint
CREATE TYPE "public"."tipo_inscricao_enum" AS ENUM('BOLSISTA', 'VOLUNTARIO', 'QUALQUER');--> statement-breakpoint
CREATE TYPE "public"."tipo_proposicao_enum" AS ENUM('INDIVIDUAL', 'COLETIVA');--> statement-breakpoint
CREATE TYPE "public"."tipo_vaga_enum" AS ENUM('BOLSISTA', 'VOLUNTARIO');--> statement-breakpoint
CREATE TABLE "aluno" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"nome_completo" varchar NOT NULL,
	"nome_social" varchar,
	"genero" "genero_enum" NOT NULL,
	"especificacao_genero" varchar,
	"email_institucional" varchar NOT NULL,
	"matricula" varchar NOT NULL,
	"rg" varchar NOT NULL,
	"cpf" varchar NOT NULL,
	"CR" real NOT NULL,
	"telefone" varchar,
	"endereco_id" integer,
	"curso_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "atividade_projeto" (
	"id" serial PRIMARY KEY NOT NULL,
	"projeto_id" integer NOT NULL,
	"descricao" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "curso" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" varchar NOT NULL,
	"codigo" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "departamento" (
	"id" serial PRIMARY KEY NOT NULL,
	"unidade_universitaria" varchar,
	"nome" varchar NOT NULL,
	"sigla" varchar,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "disciplina" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" varchar,
	"codigo" varchar,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "endereco" (
	"id" serial PRIMARY KEY NOT NULL,
	"numero" integer,
	"rua" varchar NOT NULL,
	"bairro" varchar NOT NULL,
	"cidade" varchar NOT NULL,
	"estado" varchar NOT NULL,
	"cep" varchar NOT NULL,
	"complemento" varchar,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "inscricao_documento" (
	"id" serial PRIMARY KEY NOT NULL,
	"inscricao_id" integer NOT NULL,
	"documento_unique_id" integer NOT NULL,
	"validado" boolean,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "inscricao" (
	"id" serial PRIMARY KEY NOT NULL,
	"processo_seletivo_id" integer NOT NULL,
	"aluno_id" integer NOT NULL,
	"tipo" "tipo_inscricao_enum",
	"status" "status_inscricao_enum" NOT NULL,
	"nota_prova" real,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "nota_aluno" (
	"id" serial PRIMARY KEY NOT NULL,
	"aluno_id" integer NOT NULL,
	"codigo_disciplina" varchar NOT NULL,
	"nota" real NOT NULL,
	"ano" integer NOT NULL,
	"semestre" "semestre_enum" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "processo_seletivo" (
	"id" serial PRIMARY KEY NOT NULL,
	"projeto_id" integer NOT NULL,
	"vagas_bolsista" integer NOT NULL,
	"vagas_voluntario" integer NOT NULL,
	"edital_unique_id" integer,
	"data_inicio" date NOT NULL,
	"data_final" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "professor" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"departamento_id" integer NOT NULL,
	"nome_completo" varchar NOT NULL,
	"nome_social" varchar,
	"matricula_siape" varchar,
	"genero" "genero_enum" NOT NULL,
	"regime" "regime_enum" NOT NULL,
	"especificacao_genero" varchar,
	"cpf" varchar NOT NULL,
	"telefone" varchar,
	"telefone_institucional" varchar,
	"email_institucional" varchar NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "projeto_disciplina" (
	"id" serial PRIMARY KEY NOT NULL,
	"projeto_id" integer NOT NULL,
	"disciplina_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "projeto_professor" (
	"id" serial PRIMARY KEY NOT NULL,
	"projeto_id" integer NOT NULL,
	"professor_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "projeto" (
	"id" serial PRIMARY KEY NOT NULL,
	"data_aprovacao" date,
	"departamento_id" integer NOT NULL,
	"ano" integer NOT NULL,
	"semestre" "semestre_enum" NOT NULL,
	"tipo_proposicao" "tipo_proposicao_enum" NOT NULL,
	"bolsas_solicitadas" integer NOT NULL,
	"voluntarios_solicitados" integer NOT NULL,
	"bolsas_atendidas" integer,
	"voluntarios_atendidos" integer,
	"carga_horaria_semana" integer NOT NULL,
	"numero_semanas" integer NOT NULL,
	"publico_alvo" text NOT NULL,
	"estimativa_pessoas_benificiadas" integer,
	"professor_responsavel_id" integer NOT NULL,
	"descricao" text NOT NULL,
	"status" "projeto_status_enum" DEFAULT 'SUBMETIDO' NOT NULL,
	"analise_submissao" text NOT NULL,
	"documento_unique_id" text,
	"assinatura_unique_id" text,
	"validado" boolean DEFAULT false NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "vaga" (
	"id" serial PRIMARY KEY NOT NULL,
	"aluno_id" integer NOT NULL,
	"projeto_id" integer NOT NULL,
	"tipo" "tipo_vaga_enum" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
ALTER TABLE "aluno" ADD CONSTRAINT "aluno_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aluno" ADD CONSTRAINT "aluno_endereco_id_endereco_id_fk" FOREIGN KEY ("endereco_id") REFERENCES "public"."endereco"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aluno" ADD CONSTRAINT "aluno_curso_id_curso_id_fk" FOREIGN KEY ("curso_id") REFERENCES "public"."curso"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atividade_projeto" ADD CONSTRAINT "atividade_projeto_projeto_id_projeto_id_fk" FOREIGN KEY ("projeto_id") REFERENCES "public"."projeto"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inscricao_documento" ADD CONSTRAINT "inscricao_documento_inscricao_id_inscricao_id_fk" FOREIGN KEY ("inscricao_id") REFERENCES "public"."inscricao"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inscricao" ADD CONSTRAINT "inscricao_processo_seletivo_id_processo_seletivo_id_fk" FOREIGN KEY ("processo_seletivo_id") REFERENCES "public"."processo_seletivo"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inscricao" ADD CONSTRAINT "inscricao_aluno_id_aluno_id_fk" FOREIGN KEY ("aluno_id") REFERENCES "public"."aluno"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nota_aluno" ADD CONSTRAINT "nota_aluno_aluno_id_aluno_id_fk" FOREIGN KEY ("aluno_id") REFERENCES "public"."aluno"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "processo_seletivo" ADD CONSTRAINT "processo_seletivo_projeto_id_projeto_id_fk" FOREIGN KEY ("projeto_id") REFERENCES "public"."projeto"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "professor" ADD CONSTRAINT "professor_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "professor" ADD CONSTRAINT "professor_departamento_id_departamento_id_fk" FOREIGN KEY ("departamento_id") REFERENCES "public"."departamento"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projeto_disciplina" ADD CONSTRAINT "projeto_disciplina_projeto_id_projeto_id_fk" FOREIGN KEY ("projeto_id") REFERENCES "public"."projeto"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projeto_disciplina" ADD CONSTRAINT "projeto_disciplina_disciplina_id_disciplina_id_fk" FOREIGN KEY ("disciplina_id") REFERENCES "public"."disciplina"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projeto_professor" ADD CONSTRAINT "projeto_professor_projeto_id_projeto_id_fk" FOREIGN KEY ("projeto_id") REFERENCES "public"."projeto"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projeto_professor" ADD CONSTRAINT "projeto_professor_professor_id_professor_id_fk" FOREIGN KEY ("professor_id") REFERENCES "public"."professor"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projeto" ADD CONSTRAINT "projeto_departamento_id_departamento_id_fk" FOREIGN KEY ("departamento_id") REFERENCES "public"."departamento"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projeto" ADD CONSTRAINT "projeto_professor_responsavel_id_professor_id_fk" FOREIGN KEY ("professor_responsavel_id") REFERENCES "public"."professor"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vaga" ADD CONSTRAINT "vaga_aluno_id_aluno_id_fk" FOREIGN KEY ("aluno_id") REFERENCES "public"."aluno"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vaga" ADD CONSTRAINT "vaga_projeto_id_projeto_id_fk" FOREIGN KEY ("projeto_id") REFERENCES "public"."projeto"("id") ON DELETE no action ON UPDATE no action;