CREATE TYPE "public"."genero_enum" AS ENUM('MASCULINO', 'FEMININO', 'OUTRO');--> statement-breakpoint
CREATE TYPE "public"."professor_invitation_status_enum" AS ENUM('PENDING', 'ACCEPTED', 'EXPIRED');--> statement-breakpoint
CREATE TYPE "public"."projeto_status_enum" AS ENUM('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED', 'PENDING_ADMIN_SIGNATURE', 'PENDING_PROFESSOR_SIGNATURE');--> statement-breakpoint
CREATE TYPE "public"."regime_enum" AS ENUM('20H', '40H', 'DE');--> statement-breakpoint
CREATE TYPE "public"."semestre_enum" AS ENUM('SEMESTRE_1', 'SEMESTRE_2');--> statement-breakpoint
CREATE TYPE "public"."status_envio_enum" AS ENUM('ENVIADO', 'FALHOU');--> statement-breakpoint
CREATE TYPE "public"."status_inscricao_enum" AS ENUM('SUBMITTED', 'SELECTED_BOLSISTA', 'SELECTED_VOLUNTARIO', 'ACCEPTED_BOLSISTA', 'ACCEPTED_VOLUNTARIO', 'REJECTED_BY_PROFESSOR', 'REJECTED_BY_STUDENT');--> statement-breakpoint
CREATE TYPE "public"."tipo_assinatura_enum" AS ENUM('PROJETO_PROFESSOR_RESPONSAVEL', 'TERMO_COMPROMISSO_ALUNO', 'EDITAL_ADMIN', 'ATA_SELECAO_PROFESSOR', 'PROJETO_COORDENADOR_DEPARTAMENTO');--> statement-breakpoint
CREATE TYPE "public"."tipo_documento_projeto_enum" AS ENUM('PROPOSTA_ORIGINAL', 'PROPOSTA_ASSINADA_PROFESSOR', 'PROPOSTA_ASSINADA_ADMIN', 'ATA_SELECAO');--> statement-breakpoint
CREATE TYPE "public"."tipo_inscricao_enum" AS ENUM('BOLSISTA', 'VOLUNTARIO', 'ANY');--> statement-breakpoint
CREATE TYPE "public"."tipo_proposicao_enum" AS ENUM('INDIVIDUAL', 'COLETIVA');--> statement-breakpoint
CREATE TYPE "public"."tipo_vaga_enum" AS ENUM('BOLSISTA', 'VOLUNTARIO');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'professor', 'student');--> statement-breakpoint
CREATE TABLE "aluno" (
	"id" serial PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"nome_completo" varchar NOT NULL,
	"nome_social" varchar,
	"genero" "genero_enum" NOT NULL,
	"especificacao_genero" varchar,
	"email_institucional" varchar NOT NULL,
	"matricula" varchar NOT NULL,
	"rg" varchar,
	"cpf" varchar NOT NULL,
	"CR" real NOT NULL,
	"telefone" varchar,
	"endereco_id" integer,
	"curso_id" integer NOT NULL,
	"historico_escolar_file_id" text,
	"comprovante_matricula_file_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "aluno_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "aluno_matricula_unique" UNIQUE("matricula"),
	CONSTRAINT "aluno_cpf_unique" UNIQUE("cpf")
);
--> statement-breakpoint
CREATE TABLE "assinatura_documento" (
	"id" serial PRIMARY KEY NOT NULL,
	"assinatura_data" text NOT NULL,
	"tipo_assinatura" "tipo_assinatura_enum" NOT NULL,
	"user_id" integer NOT NULL,
	"projeto_id" integer,
	"vaga_id" integer,
	"edital_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "ata_selecao" (
	"id" serial PRIMARY KEY NOT NULL,
	"projeto_id" integer NOT NULL,
	"file_id" text,
	"conteudo_html" text,
	"data_geracao" timestamp with time zone DEFAULT now() NOT NULL,
	"gerado_por_user_id" integer NOT NULL,
	"assinado" boolean DEFAULT false NOT NULL,
	"data_assinatura" timestamp with time zone,
	CONSTRAINT "ata_selecao_projeto_id_unique" UNIQUE("projeto_id")
);
--> statement-breakpoint
CREATE TABLE "atividade_projeto" (
	"id" serial PRIMARY KEY NOT NULL,
	"projeto_id" integer NOT NULL,
	"descricao" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "curso" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" varchar NOT NULL,
	"codigo" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "departamento" (
	"id" serial PRIMARY KEY NOT NULL,
	"unidade_universitaria" varchar NOT NULL,
	"nome" varchar NOT NULL,
	"sigla" varchar,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "disciplina_professor_responsavel" (
	"id" serial PRIMARY KEY NOT NULL,
	"disciplina_id" integer NOT NULL,
	"professor_id" integer NOT NULL,
	"ano" integer NOT NULL,
	"semestre" "semestre_enum" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "disciplina" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" varchar NOT NULL,
	"codigo" varchar NOT NULL,
	"departamento_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "edital" (
	"id" serial PRIMARY KEY NOT NULL,
	"periodo_inscricao_id" integer NOT NULL,
	"numero_edital" varchar(50) NOT NULL,
	"titulo" varchar(255) DEFAULT 'Edital Interno de Seleção de Monitores' NOT NULL,
	"descricao_html" text,
	"file_id_assinado" text,
	"data_publicacao" date,
	"publicado" boolean DEFAULT false NOT NULL,
	"criado_por_user_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "edital_periodo_inscricao_id_unique" UNIQUE("periodo_inscricao_id"),
	CONSTRAINT "edital_numero_edital_unique" UNIQUE("numero_edital")
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
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "importacao_planejamento" (
	"id" serial PRIMARY KEY NOT NULL,
	"file_id" text NOT NULL,
	"nome_arquivo" varchar NOT NULL,
	"ano" integer NOT NULL,
	"semestre" "semestre_enum" NOT NULL,
	"total_projetos" integer DEFAULT 0 NOT NULL,
	"projetos_criados" integer DEFAULT 0 NOT NULL,
	"projetos_com_erro" integer DEFAULT 0 NOT NULL,
	"status" varchar DEFAULT 'PROCESSANDO' NOT NULL,
	"erros" text,
	"importado_por_user_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "inscricao_documento" (
	"id" serial PRIMARY KEY NOT NULL,
	"inscricao_id" integer NOT NULL,
	"file_id" text NOT NULL,
	"tipo_documento" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "inscricao" (
	"id" serial PRIMARY KEY NOT NULL,
	"periodo_inscricao_id" integer NOT NULL,
	"projeto_id" integer NOT NULL,
	"aluno_id" integer NOT NULL,
	"tipo_vaga_pretendida" "tipo_inscricao_enum",
	"status" "status_inscricao_enum" DEFAULT 'SUBMITTED' NOT NULL,
	"nota_disciplina" numeric(4, 2),
	"nota_selecao" numeric(4, 2),
	"cr" numeric(4, 2),
	"nota_final" numeric(4, 2),
	"feedback_professor" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "nota_aluno" (
	"id" serial PRIMARY KEY NOT NULL,
	"aluno_id" integer NOT NULL,
	"disciplina_id" integer NOT NULL,
	"nota" real NOT NULL,
	"ano" integer NOT NULL,
	"semestre" "semestre_enum" NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "notificacao_historico" (
	"id" serial PRIMARY KEY NOT NULL,
	"destinatario_email" text NOT NULL,
	"assunto" varchar(255) NOT NULL,
	"tipo_notificacao" varchar(100) NOT NULL,
	"status_envio" "status_envio_enum" NOT NULL,
	"data_envio" timestamp with time zone DEFAULT now() NOT NULL,
	"mensagem_erro" text,
	"projeto_id" integer,
	"aluno_id" integer,
	"remetente_user_id" integer
);
--> statement-breakpoint
CREATE TABLE "periodo_inscricao" (
	"id" serial PRIMARY KEY NOT NULL,
	"semestre" "semestre_enum" NOT NULL,
	"ano" integer NOT NULL,
	"data_inicio" date NOT NULL,
	"data_fim" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "professor_invitation" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"token" varchar(255) NOT NULL,
	"status" "professor_invitation_status_enum" DEFAULT 'PENDING' NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"invited_by_user_id" integer NOT NULL,
	"accepted_by_user_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "professor_invitation_email_unique" UNIQUE("email"),
	CONSTRAINT "professor_invitation_token_unique" UNIQUE("token")
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
	"curriculum_vitae_file_id" text,
	"comprovante_vinculo_file_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "professor_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE "projeto_disciplina" (
	"id" serial PRIMARY KEY NOT NULL,
	"projeto_id" integer NOT NULL,
	"disciplina_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projeto_documento" (
	"id" serial PRIMARY KEY NOT NULL,
	"projeto_id" integer NOT NULL,
	"file_id" text NOT NULL,
	"tipo_documento" "tipo_documento_projeto_enum" NOT NULL,
	"assinado_por_user_id" integer,
	"observacoes" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "projeto_professor_participante" (
	"id" serial PRIMARY KEY NOT NULL,
	"projeto_id" integer NOT NULL,
	"professor_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "projeto" (
	"id" serial PRIMARY KEY NOT NULL,
	"departamento_id" integer NOT NULL,
	"ano" integer NOT NULL,
	"semestre" "semestre_enum" NOT NULL,
	"tipo_proposicao" "tipo_proposicao_enum" NOT NULL,
	"bolsas_solicitadas" integer DEFAULT 0 NOT NULL,
	"voluntarios_solicitados" integer DEFAULT 0 NOT NULL,
	"bolsas_disponibilizadas" integer DEFAULT 0,
	"carga_horaria_semana" integer NOT NULL,
	"numero_semanas" integer NOT NULL,
	"publico_alvo" text NOT NULL,
	"estimativa_pessoas_benificiadas" integer,
	"professor_responsavel_id" integer NOT NULL,
	"titulo" varchar NOT NULL,
	"descricao" text NOT NULL,
	"status" "projeto_status_enum" DEFAULT 'DRAFT' NOT NULL,
	"assinatura_professor" text,
	"feedback_admin" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE "projeto_template" (
	"id" serial PRIMARY KEY NOT NULL,
	"disciplina_id" integer NOT NULL,
	"titulo_default" varchar(255),
	"descricao_default" text,
	"carga_horaria_semana_default" integer,
	"numero_semanas_default" integer,
	"publico_alvo_default" text,
	"atividades_default" text,
	"criado_por_user_id" integer NOT NULL,
	"ultima_atualizacao_user_id" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "projeto_template_disciplina_id_unique" UNIQUE("disciplina_id")
);
--> statement-breakpoint
CREATE TABLE "session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"role" "user_role" DEFAULT 'student' NOT NULL,
	CONSTRAINT "user_username_unique" UNIQUE("username"),
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "vaga" (
	"id" serial PRIMARY KEY NOT NULL,
	"aluno_id" integer NOT NULL,
	"projeto_id" integer NOT NULL,
	"inscricao_id" integer NOT NULL,
	"tipo" "tipo_vaga_enum" NOT NULL,
	"data_inicio" date,
	"data_fim" date,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "vaga_inscricao_id_unique" UNIQUE("inscricao_id")
);
--> statement-breakpoint
ALTER TABLE "aluno" ADD CONSTRAINT "aluno_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aluno" ADD CONSTRAINT "aluno_endereco_id_endereco_id_fk" FOREIGN KEY ("endereco_id") REFERENCES "public"."endereco"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "aluno" ADD CONSTRAINT "aluno_curso_id_curso_id_fk" FOREIGN KEY ("curso_id") REFERENCES "public"."curso"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assinatura_documento" ADD CONSTRAINT "assinatura_documento_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assinatura_documento" ADD CONSTRAINT "assinatura_documento_projeto_id_projeto_id_fk" FOREIGN KEY ("projeto_id") REFERENCES "public"."projeto"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assinatura_documento" ADD CONSTRAINT "assinatura_documento_vaga_id_vaga_id_fk" FOREIGN KEY ("vaga_id") REFERENCES "public"."vaga"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "assinatura_documento" ADD CONSTRAINT "assinatura_documento_edital_id_edital_id_fk" FOREIGN KEY ("edital_id") REFERENCES "public"."edital"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ata_selecao" ADD CONSTRAINT "ata_selecao_projeto_id_projeto_id_fk" FOREIGN KEY ("projeto_id") REFERENCES "public"."projeto"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "ata_selecao" ADD CONSTRAINT "ata_selecao_gerado_por_user_id_user_id_fk" FOREIGN KEY ("gerado_por_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "atividade_projeto" ADD CONSTRAINT "atividade_projeto_projeto_id_projeto_id_fk" FOREIGN KEY ("projeto_id") REFERENCES "public"."projeto"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disciplina_professor_responsavel" ADD CONSTRAINT "disciplina_professor_responsavel_disciplina_id_disciplina_id_fk" FOREIGN KEY ("disciplina_id") REFERENCES "public"."disciplina"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disciplina_professor_responsavel" ADD CONSTRAINT "disciplina_professor_responsavel_professor_id_professor_id_fk" FOREIGN KEY ("professor_id") REFERENCES "public"."professor"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "disciplina" ADD CONSTRAINT "disciplina_departamento_id_departamento_id_fk" FOREIGN KEY ("departamento_id") REFERENCES "public"."departamento"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edital" ADD CONSTRAINT "edital_periodo_inscricao_id_periodo_inscricao_id_fk" FOREIGN KEY ("periodo_inscricao_id") REFERENCES "public"."periodo_inscricao"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "edital" ADD CONSTRAINT "edital_criado_por_user_id_user_id_fk" FOREIGN KEY ("criado_por_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "importacao_planejamento" ADD CONSTRAINT "importacao_planejamento_importado_por_user_id_user_id_fk" FOREIGN KEY ("importado_por_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inscricao_documento" ADD CONSTRAINT "inscricao_documento_inscricao_id_inscricao_id_fk" FOREIGN KEY ("inscricao_id") REFERENCES "public"."inscricao"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inscricao" ADD CONSTRAINT "inscricao_periodo_inscricao_id_periodo_inscricao_id_fk" FOREIGN KEY ("periodo_inscricao_id") REFERENCES "public"."periodo_inscricao"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inscricao" ADD CONSTRAINT "inscricao_projeto_id_projeto_id_fk" FOREIGN KEY ("projeto_id") REFERENCES "public"."projeto"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "inscricao" ADD CONSTRAINT "inscricao_aluno_id_aluno_id_fk" FOREIGN KEY ("aluno_id") REFERENCES "public"."aluno"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nota_aluno" ADD CONSTRAINT "nota_aluno_aluno_id_aluno_id_fk" FOREIGN KEY ("aluno_id") REFERENCES "public"."aluno"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "nota_aluno" ADD CONSTRAINT "nota_aluno_disciplina_id_disciplina_id_fk" FOREIGN KEY ("disciplina_id") REFERENCES "public"."disciplina"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notificacao_historico" ADD CONSTRAINT "notificacao_historico_projeto_id_projeto_id_fk" FOREIGN KEY ("projeto_id") REFERENCES "public"."projeto"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notificacao_historico" ADD CONSTRAINT "notificacao_historico_aluno_id_aluno_id_fk" FOREIGN KEY ("aluno_id") REFERENCES "public"."aluno"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "notificacao_historico" ADD CONSTRAINT "notificacao_historico_remetente_user_id_user_id_fk" FOREIGN KEY ("remetente_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "professor_invitation" ADD CONSTRAINT "professor_invitation_invited_by_user_id_user_id_fk" FOREIGN KEY ("invited_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "professor_invitation" ADD CONSTRAINT "professor_invitation_accepted_by_user_id_user_id_fk" FOREIGN KEY ("accepted_by_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "professor" ADD CONSTRAINT "professor_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "professor" ADD CONSTRAINT "professor_departamento_id_departamento_id_fk" FOREIGN KEY ("departamento_id") REFERENCES "public"."departamento"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projeto_disciplina" ADD CONSTRAINT "projeto_disciplina_projeto_id_projeto_id_fk" FOREIGN KEY ("projeto_id") REFERENCES "public"."projeto"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projeto_disciplina" ADD CONSTRAINT "projeto_disciplina_disciplina_id_disciplina_id_fk" FOREIGN KEY ("disciplina_id") REFERENCES "public"."disciplina"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projeto_documento" ADD CONSTRAINT "projeto_documento_projeto_id_projeto_id_fk" FOREIGN KEY ("projeto_id") REFERENCES "public"."projeto"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projeto_documento" ADD CONSTRAINT "projeto_documento_assinado_por_user_id_user_id_fk" FOREIGN KEY ("assinado_por_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projeto_professor_participante" ADD CONSTRAINT "projeto_professor_participante_projeto_id_projeto_id_fk" FOREIGN KEY ("projeto_id") REFERENCES "public"."projeto"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projeto_professor_participante" ADD CONSTRAINT "projeto_professor_participante_professor_id_professor_id_fk" FOREIGN KEY ("professor_id") REFERENCES "public"."professor"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projeto" ADD CONSTRAINT "projeto_departamento_id_departamento_id_fk" FOREIGN KEY ("departamento_id") REFERENCES "public"."departamento"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projeto" ADD CONSTRAINT "projeto_professor_responsavel_id_professor_id_fk" FOREIGN KEY ("professor_responsavel_id") REFERENCES "public"."professor"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projeto_template" ADD CONSTRAINT "projeto_template_disciplina_id_disciplina_id_fk" FOREIGN KEY ("disciplina_id") REFERENCES "public"."disciplina"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projeto_template" ADD CONSTRAINT "projeto_template_criado_por_user_id_user_id_fk" FOREIGN KEY ("criado_por_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "projeto_template" ADD CONSTRAINT "projeto_template_ultima_atualizacao_user_id_user_id_fk" FOREIGN KEY ("ultima_atualizacao_user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vaga" ADD CONSTRAINT "vaga_aluno_id_aluno_id_fk" FOREIGN KEY ("aluno_id") REFERENCES "public"."aluno"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vaga" ADD CONSTRAINT "vaga_projeto_id_projeto_id_fk" FOREIGN KEY ("projeto_id") REFERENCES "public"."projeto"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "vaga" ADD CONSTRAINT "vaga_inscricao_id_inscricao_id_fk" FOREIGN KEY ("inscricao_id") REFERENCES "public"."inscricao"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "codigo_unico_por_departamento_idx" ON "disciplina" USING btree ("codigo","departamento_id");