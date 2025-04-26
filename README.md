# Sistema de Monitoria IC

[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

Aplicação web para gerenciar o fluxo de trabalho do Programa de Monitoria da UFBA, desde a proposta de projetos pelos professores até a inscrição e seleção de alunos, incluindo o manuseio de documentos e notificações.

Construído com [Vinxi](https://vinxi.dev/), [React](https://react.dev/), [TypeScript](https://www.typescriptlang.org/), [Tailwind CSS](https://tailwindcss.com/), [shadcn/ui](https://ui.shadcn.com/), [TanStack Router](https://tanstack.com/router/latest), [TanStack Query](https://tanstack.com/query/latest), [Drizzle ORM](https://orm.drizzle.team/) e [Lucia Auth](https://lucia-auth.com/).

## Visão Geral

Este projeto visa simplificar a gestão do Programa de Monitoria da UFBA. As funcionalidades chave incluem:

- **Gerenciamento de Projetos:** Professores propõem, gerenciam e submetem projetos de monitoria. Administradores revisam e aprovam/rejeitam projetos.
- **Papéis de Usuário:** Papéis distintos para Administradores, Professores e Alunos com permissões específicas.
- **Fluxo de Inscrição:** Alunos se inscrevem para vagas de monitoria durante períodos definidos. Professores selecionam candidatos.
- **Gerenciamento de Vagas:** Administradores definem vagas de bolsista, Professores definem vagas de voluntário.
- **Manuseio de Documentos:** Upload e armazenamento para propostas de projeto, editais oficiais e atas de seleção.
- **Notificações:** Notificações por e-mail para eventos chave (planejado).

Para uma descrição detalhada dos papéis e regras de negócio, veja [docs/project-description.mdc](./docs/project-description.mdc).

## Tecnologias Utilizadas (Tech Stack)

- **Framework:** [React](https://react.dev/) via [Vinxi](https://vinxi.dev/) (servindo HTML, assets do cliente e API)
- **Linguagem:** [TypeScript](https://www.typescriptlang.org/)
- **Roteamento:** [TanStack Router](https://tanstack.com/router/latest)
- **API & Estado do Servidor:** [TanStack Query](https://tanstack.com/query/latest)
- **ORM de Banco de Dados:** [Drizzle ORM](https://orm.drizzle.team/) com PostgreSQL
- **Autenticação:** [Lucia Auth](https://lucia-auth.com/)
- **Componentes de UI:** [shadcn/ui](https://ui.shadcn.com/)
- **Estilização:** [Tailwind CSS](https://tailwindcss.com/)
- **Banco de Dados:** PostgreSQL (gerenciado via Docker)

Para mais detalhes sobre as bibliotecas escolhidas, veja [docs/tech-stack-plan.md](./docs/tech-stack-plan.md).

## Como Começar

Para configurar o projeto localmente, siga os passos no [Guia de Configuração Local](./docs/setup-guide.md).

## Plano de Desenvolvimento

O desenvolvimento está planejado em fases. Você pode encontrar o detalhamento no [Plano de Desenvolvimento](./docs/plan.md).

## Comandos de Desenvolvimento

- `npm install`: Instala as dependências.
- `npm run dev`: Inicia o servidor de desenvolvimento (frontend & backend).
- `npm run build`: Compila a aplicação para produção.
- `npm run start`: Executa a build de produção localmente.
- `npm run db:generate`: Gera arquivos de migração do Drizzle ORM com base nas mudanças do schema.
- `npm run db:migrate`: Aplica as migrações pendentes do banco de dados.
- `npm run db:studio`: Abre o Drizzle Studio para inspecionar o banco de dados.
- `npm run docker:up`: Inicia o contêiner do banco de dados PostgreSQL.
- `npm run docker:down`: Para e remove o contêiner do banco de dados PostgreSQL.
- `npm run docker:clean`: Para, remove o contêiner e exclui o volume de dados (use com cuidado).

## Contribuindo

Por favor, consulte as diretrizes de desenvolvimento de código e convenções de mensagens de commit do projeto ao contribuir. (Detalhes podem ser adicionados posteriormente).
