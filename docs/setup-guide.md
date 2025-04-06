# Guia de Configuração Local - Sistema de Monitoria IC

Este guia detalha os passos necessários para configurar e executar o projeto Sistema de Monitoria IC localmente após clonar o repositório.

## Pré-requisitos

Certifique-se de ter as seguintes ferramentas instaladas em seu sistema:

*   **Node.js:** Versão 18 ou superior.
*   **npm:** Versão 9.14.2 ou superior (geralmente vem com o Node.js).
*   **Docker:** Para executar o banco de dados PostgreSQL em um contêiner.
*   **Docker Compose:** Para gerenciar o contêiner Docker (geralmente vem com o Docker Desktop).
*   **Git:** Para clonar o repositório.

## Passos de Configuração

1.  **Clonar o Repositório:**
    ```bash
    git clone https://github.com/luisfelipesena/sistema-de-monitoria-ic
    cd sistema-de-monitoria-ic
    ```

2.  **Configurar Variáveis de Ambiente:**

    *   **Backend:**
        *   Navegue até a pasta `apps/backend`.
        *   Copie o arquivo `.env.sample` para um novo arquivo chamado `.env`:
            ```bash
            cp apps/backend/.env.sample apps/backend/.env
            ```
        *   **Importante:** Abra o arquivo `apps/backend/.env` e **altere** a variável `DATABASE_URL` para corresponder à configuração do Docker Compose. O valor correto deve ser:
            ```dotenv
            DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sistema-de-monitoria-ic"
            ```
            *(A porta padrão é `5432`, o usuário/senha é `postgres`, e o banco de dados é `sistema-de-monitoria-ic`, conforme definido em `docker-compose.yml`)*

    *   **Frontend:**
        *   Navegue até a pasta `apps/frontend`.
        *   Copie o arquivo `.env.sample` para um novo arquivo chamado `.env`:
            ```bash
            cp apps/frontend/.env.sample apps/frontend/.env
            ```
        *   Verifique se a variável `VITE_API_URL` no arquivo `apps/frontend/.env` aponta para o endereço onde o backend será executado (o padrão `http://localhost:3000` geralmente está correto).
            ```dotenv
            VITE_API_URL=http://localhost:3000
            ```

3.  **Iniciar o Banco de Dados:**
    *   Volte para a raiz do projeto.
    *   Execute o comando para iniciar o contêiner do PostgreSQL em background usando Docker Compose:
        ```bash
        npm run docker:up
        ```
    *   Aguarde alguns segundos para o banco de dados iniciar completamente. Você pode verificar os logs com `npm run docker:logs`.

4.  **Instalar Dependências:**
    *   Na raiz do projeto, instale todas as dependências do Node.js para o root, frontend e backend:
        ```bash
        npm install
        ```

5.  **Executar Migrações do Banco de Dados:**
    *   Com o banco de dados rodando (passo 3), aplique as migrações para criar as tabelas e estruturas necessárias:
        ```bash
        npm run migration:run
        ```
        *(Este comando executa `drizzle-kit migrate` dentro da pasta `apps/backend`)*

6.  **Executar o Projeto:**
    *   Na raiz do projeto, inicie os servidores de desenvolvimento do frontend e backend simultaneamente:
        ```bash
        npm run dev
        ```
    *   Este comando utiliza o `turbo` para executar os scripts `dev` definidos nos `package.json` de `apps/frontend` e `apps/backend`.

7.  **Acessar a Aplicação:**
    *   **Frontend:** Abra seu navegador e acesse `http://localhost:5173` (porta padrão do Vite).
    *   **Backend API:** A API estará rodando em `http://localhost:3000` (porta padrão configurada).

## Parando os Serviços

*   Para parar os servidores de desenvolvimento (frontend/backend), pressione `Ctrl + C` no terminal onde `npm run dev` está rodando.
*   Para parar e remover o contêiner do banco de dados:
    ```bash
    npm run docker:down
    ```
*   Para parar, remover o contêiner e **excluir o volume de dados** (use com cuidado!):
    ```bash
    npm run docker:clean
    ```

Com estes passos, o ambiente de desenvolvimento local do Sistema de Monitoria IC deve estar configurado e rodando. 