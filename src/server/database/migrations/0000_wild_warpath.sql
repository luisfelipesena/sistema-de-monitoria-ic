DO $$ BEGIN
 CREATE TYPE "public"."genero_enum" AS ENUM('MASCULINO', 'FEMININO', 'OUTRO');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."projeto_status_enum" AS ENUM('DRAFT', 'SUBMITTED', 'APPROVED', 'REJECTED');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."regime_enum" AS ENUM('20H', '40H', 'DE');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."semestre_enum" AS ENUM('SEMESTRE_1', 'SEMESTRE_2');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."status_inscricao_enum" AS ENUM('SUBMITTED', 'SELECTED_BOLSISTA', 'SELECTED_VOLUNTARIO', 'ACCEPTED_BOLSISTA', 'ACCEPTED_VOLUNTARIO', 'REJECTED_BY_PROFESSOR', 'REJECTED_BY_STUDENT');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."tipo_inscricao_enum" AS ENUM('BOLSISTA', 'VOLUNTARIO', 'ANY');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."tipo_proposicao_enum" AS ENUM('INDIVIDUAL', 'COLETIVA');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."tipo_vaga_enum" AS ENUM('BOLSISTA', 'VOLUNTARIO');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 CREATE TYPE "public"."user_role" AS ENUM('admin', 'professor', 'student');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "aluno" (
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
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	CONSTRAINT "aluno_user_id_unique" UNIQUE("user_id"),
	CONSTRAINT "aluno_matricula_unique" UNIQUE("matricula"),
	CONSTRAINT "aluno_cpf_unique" UNIQUE("cpf")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "atividade_projeto" (
	"id" serial PRIMARY KEY NOT NULL,
	"projeto_id" integer NOT NULL,
	"descricao" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "curso" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" varchar NOT NULL,
	"codigo" integer,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "departamento" (
	"id" serial PRIMARY KEY NOT NULL,
	"unidade_universitaria" varchar,
	"nome" varchar NOT NULL,
	"sigla" varchar,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "disciplina" (
	"id" serial PRIMARY KEY NOT NULL,
	"nome" varchar NOT NULL,
	"codigo" varchar NOT NULL,
	"departamento_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	CONSTRAINT "disciplina_codigo_unique" UNIQUE("codigo")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "endereco" (
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
CREATE TABLE IF NOT EXISTS "inscricao_documento" (
	"id" serial PRIMARY KEY NOT NULL,
	"inscricao_id" integer NOT NULL,
	"tipo_documento" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "inscricao" (
	"id" serial PRIMARY KEY NOT NULL,
	"periodo_inscricao_id" integer NOT NULL,
	"projeto_id" integer NOT NULL,
	"aluno_id" integer NOT NULL,
	"tipo_vaga_pretendida" "tipo_inscricao_enum",
	"status" "status_inscricao_enum" DEFAULT 'SUBMITTED' NOT NULL,
	"feedback_professor" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "nota_aluno" (
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
CREATE TABLE IF NOT EXISTS "periodo_inscricao" (
	"id" serial PRIMARY KEY NOT NULL,
	"semestre" "semestre_enum" NOT NULL,
	"ano" integer NOT NULL,
	"data_inicio" date NOT NULL,
	"data_fim" date NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "professor" (
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
	"updated_at" timestamp with time zone,
	CONSTRAINT "professor_user_id_unique" UNIQUE("user_id")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "projeto_disciplina" (
	"id" serial PRIMARY KEY NOT NULL,
	"projeto_id" integer NOT NULL,
	"disciplina_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "projeto_professor_participante" (
	"id" serial PRIMARY KEY NOT NULL,
	"projeto_id" integer NOT NULL,
	"professor_id" integer NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "projeto" (
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
	"feedback_admin" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone,
	"deleted_at" timestamp with time zone
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "session" (
	"id" text PRIMARY KEY NOT NULL,
	"user_id" integer NOT NULL,
	"expires_at" timestamp with time zone NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "user" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" text NOT NULL,
	"email" text NOT NULL,
	"role" "user_role" DEFAULT 'student' NOT NULL,
	CONSTRAINT "user_username_unique" UNIQUE("username"),
	CONSTRAINT "user_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS "vaga" (
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
DO $$ BEGIN
 ALTER TABLE "aluno" ADD CONSTRAINT "aluno_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "aluno" ADD CONSTRAINT "aluno_endereco_id_endereco_id_fk" FOREIGN KEY ("endereco_id") REFERENCES "public"."endereco"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "aluno" ADD CONSTRAINT "aluno_curso_id_curso_id_fk" FOREIGN KEY ("curso_id") REFERENCES "public"."curso"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "atividade_projeto" ADD CONSTRAINT "atividade_projeto_projeto_id_projeto_id_fk" FOREIGN KEY ("projeto_id") REFERENCES "public"."projeto"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "disciplina" ADD CONSTRAINT "disciplina_departamento_id_departamento_id_fk" FOREIGN KEY ("departamento_id") REFERENCES "public"."departamento"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "inscricao_documento" ADD CONSTRAINT "inscricao_documento_inscricao_id_inscricao_id_fk" FOREIGN KEY ("inscricao_id") REFERENCES "public"."inscricao"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "inscricao" ADD CONSTRAINT "inscricao_periodo_inscricao_id_periodo_inscricao_id_fk" FOREIGN KEY ("periodo_inscricao_id") REFERENCES "public"."periodo_inscricao"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "inscricao" ADD CONSTRAINT "inscricao_projeto_id_projeto_id_fk" FOREIGN KEY ("projeto_id") REFERENCES "public"."projeto"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "inscricao" ADD CONSTRAINT "inscricao_aluno_id_aluno_id_fk" FOREIGN KEY ("aluno_id") REFERENCES "public"."aluno"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "nota_aluno" ADD CONSTRAINT "nota_aluno_aluno_id_aluno_id_fk" FOREIGN KEY ("aluno_id") REFERENCES "public"."aluno"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "nota_aluno" ADD CONSTRAINT "nota_aluno_disciplina_id_disciplina_id_fk" FOREIGN KEY ("disciplina_id") REFERENCES "public"."disciplina"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "professor" ADD CONSTRAINT "professor_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "professor" ADD CONSTRAINT "professor_departamento_id_departamento_id_fk" FOREIGN KEY ("departamento_id") REFERENCES "public"."departamento"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "projeto_disciplina" ADD CONSTRAINT "projeto_disciplina_projeto_id_projeto_id_fk" FOREIGN KEY ("projeto_id") REFERENCES "public"."projeto"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "projeto_disciplina" ADD CONSTRAINT "projeto_disciplina_disciplina_id_disciplina_id_fk" FOREIGN KEY ("disciplina_id") REFERENCES "public"."disciplina"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "projeto_professor_participante" ADD CONSTRAINT "projeto_professor_participante_projeto_id_projeto_id_fk" FOREIGN KEY ("projeto_id") REFERENCES "public"."projeto"("id") ON DELETE cascade ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "projeto_professor_participante" ADD CONSTRAINT "projeto_professor_participante_professor_id_professor_id_fk" FOREIGN KEY ("professor_id") REFERENCES "public"."professor"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "projeto" ADD CONSTRAINT "projeto_departamento_id_departamento_id_fk" FOREIGN KEY ("departamento_id") REFERENCES "public"."departamento"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "projeto" ADD CONSTRAINT "projeto_professor_responsavel_id_professor_id_fk" FOREIGN KEY ("professor_responsavel_id") REFERENCES "public"."professor"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "session" ADD CONSTRAINT "session_user_id_user_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vaga" ADD CONSTRAINT "vaga_aluno_id_aluno_id_fk" FOREIGN KEY ("aluno_id") REFERENCES "public"."aluno"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vaga" ADD CONSTRAINT "vaga_projeto_id_projeto_id_fk" FOREIGN KEY ("projeto_id") REFERENCES "public"."projeto"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
--> statement-breakpoint
DO $$ BEGIN
 ALTER TABLE "vaga" ADD CONSTRAINT "vaga_inscricao_id_inscricao_id_fk" FOREIGN KEY ("inscricao_id") REFERENCES "public"."inscricao"("id") ON DELETE no action ON UPDATE no action;
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;
