# 🌱 Database Seed

Este script popula o banco de dados com dados úteis para desenvolvimento local.

## 📋 Scripts Disponíveis

### `npm run db:seed`
Executa apenas o seed do banco de dados (mantém dados existentes se não houver conflitos).

### `npm run db:reset`
**⚠️ CUIDADO**: Este comando:
1. Remove todas as tabelas (`db:drop`)
2. Recria o schema (`db:push`)
3. Popula com dados de seed (`db:seed`)

## 🎯 Dados Criados

### 🏢 Departamentos (5)
- **DCC**: Departamento de Ciência da Computação
- **MAT**: Departamento de Matemática
- **EST**: Departamento de Estatística
- **FIS**: Departamento de Física
- **COMP**: Departamento de Engenharia de Computação

### 🎓 Cursos (6)
- Ciência da Computação (Bacharelado)
- Sistemas de Informação (Bacharelado)
- Matemática (Licenciatura)
- Estatística (Bacharelado)
- Física (Bacharelado)
- Engenharia de Computação (Bacharelado)

### 📚 Disciplinas (27)
- **Ciência da Computação**: Introdução à Programação, POO, Estruturas de Dados, etc.
- **Matemática**: Cálculo I, Cálculo II, Álgebra Linear, etc.
- **Estatística**: Estatística Descritiva, Probabilidade, etc.
- **Física**: Física I, II, III, Mecânica Clássica
- **Engenharia**: Circuitos Digitais, Microprocessadores, etc.

### 👤 Usuários (9)
- **1 Admin**: `admin@ufba.br`
- **4 Professores**: `carlos.silva@ufba.br`, `ana.pereira@ufba.br`, etc.
- **4 Alunos**: `aluno1@ufba.br`, `aluno2@ufba.br`, etc.

### 📋 Projetos de Monitoria (4)
- **Aprovados**: Introdução à Programação, Física I
- **Submetidos**: Programação Orientada a Objetos
- **Rascunhos**: Cálculo I

### 📅 Períodos de Inscrição (2)
- **2025.1**: 15/01 a 15/02
- **2025.2**: 15/07 a 15/08

## 🔑 Credenciais de Acesso

Todos os usuários têm a senha: `123456`

| Tipo | Email | Senha | Descrição |
|------|-------|-------|-----------|
| Admin | `admin@ufba.br` | `123456` | Acesso completo ao sistema |
| Professor | `carlos.silva@ufba.br` | `123456` | Professor DCC com projetos |
| Professor | `ana.pereira@ufba.br` | `123456` | Professor DCC |
| Professor | `joao.santos@ufba.br` | `123456` | Professor MAT |
| Professor | `maria.costa@ufba.br` | `123456` | Professor FIS |
| Aluno | `aluno1@ufba.br` | `123456` | Aluno CC (CR: 8.5) |
| Aluno | `aluno2@ufba.br` | `123456` | Aluno CC (CR: 9.0) |
| Aluno | `aluno3@ufba.br` | `123456` | Aluno SI (CR: 7.8) |
| Aluno | `aluno4@ufba.br` | `123456` | Aluno MAT (CR: 8.2) |

## 🔧 Como Usar

### Primeira vez:
```bash
# Instalar dependências
npm install

# Configurar banco de dados
npm run db:push

# Popular com dados
npm run db:seed
```

### Reset completo:
```bash
# Remove tudo e recria
npm run db:reset
```

### Apenas seed:
```bash
# Adiciona dados sem remover existentes
npm run db:seed
```

## 📊 Benefícios para Desenvolvimento

1. **Dados Realistas**: Departamentos, cursos e disciplinas reais da UFBA
2. **Usuários Diversos**: Admin, professores e alunos para testar diferentes roles
3. **Projetos Variados**: Diferentes status para testar todo o workflow
4. **Relacionamentos Completos**: Disciplinas → Professores → Projetos → Alunos
5. **Períodos Configurados**: Permite testar inscrições e processos seletivos

## 🚀 Cenários de Teste

### Professor (`carlos.silva@ufba.br`):
- Tem projeto aprovado (Introdução à Programação)
- Responsável por disciplinas
- Pode criar novos projetos
- Pode visualizar candidatos

### Admin (`admin@ufba.br`):
- Pode aprovar/rejeitar projetos
- Acesso a todos os dashboards
- Pode gerenciar usuários
- Pode assinar documentos

### Aluno (`aluno1@ufba.br`):
- Pode se inscrever em projetos
- Tem histórico acadêmico
- Pode visualizar resultados
- Diferentes CRs para teste de seleção

## 📝 Customização

Para modificar os dados, edite o arquivo `src/scripts/seed.ts`:

- Adicione novos departamentos
- Crie mais disciplinas
- Adicione usuários específicos
- Configure projetos personalizados

## ⚠️ Importante

- **Não use em produção**: Este seed é apenas para desenvolvimento
- **Senhas simples**: Todas as senhas são `123456`
- **Dados fictícios**: CPFs e outros dados são para teste apenas
- **Reset cuidadoso**: `db:reset` remove TODOS os dados