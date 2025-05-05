# Guia de Configuração Local - Sistema de Monitoria IC

Este guia detalha os passos necessários para configurar e executar o projeto Sistema de Monitoria IC localmente após clonar o repositório.

## Pré-requisitos

Certifique-se de ter as seguintes ferramentas instaladas em seu sistema:

- **Node.js:** Versão especificada em `.nvmrc` (ou superior). Use `nvm use` na raiz do projeto.
- **npm:** Versão especificada em `package.json` (ou superior).
- **Docker:** Para executar o banco de dados PostgreSQL em um contêiner.
- **Docker Compose:** Para gerenciar o contêiner Docker (geralmente vem com o Docker Desktop).
- **Git:** Para clonar o repositório.

## Passos de Configuração

1.  **Clonar o Repositório:**

    ```bash
    git clone https://github.com/luisfelipesena/sistema-de-monitoria-ic
    cd sistema-de-monitoria-ic
    ```

2.  **Configurar Variáveis de Ambiente:**

    - **Principal:**
      - Na raiz do projeto, copie o arquivo `.env.sample` para um novo arquivo chamado `.env`:
        ```bash
        cp .env.sample .env
        ```
      - **Importante:** Abra o arquivo `.env` e **revise** as variáveis. Certifique-se de que `DATABASE_URL` corresponda à configuração do Docker Compose. O valor padrão geralmente é:
        ```dotenv
        DATABASE_URL="postgresql://postgres:postgres@localhost:5432/sistema-de-monitoria-ic"
        ```
        _(A porta padrão é `5432`, o usuário/senha é `postgres`, e o banco de dados é `sistema-de-monitoria-ic`, conforme definido em `docker-compose.yml`)._
      - A variável `VITE_API_URL` (se ainda existir no `.env.sample`) pode não ser estritamente necessária, pois o Vinxi pode lidar com o roteamento de API internamente. Se usada pelo código do cliente, deve apontar para o URL base onde a aplicação é servida (ex: `http://localhost:3000`).

3.  **Instalar Dependências:**

    - Na raiz do projeto, certifique-se de estar usando a versão correta do Node.js e instale todas as dependências:
      ```bash
      nvm use
      npm install
      ```

4.  **Iniciar o Banco de Dados:**

    - Na raiz do projeto, execute o comando para iniciar o contêiner do PostgreSQL em background usando Docker Compose:
      ```bash
      docker compose up -d
      ```
    - Aguarde alguns segundos para o banco de dados iniciar completamente. Você pode verificar os logs com `docker compose logs -f` (execute em outro terminal se necessário).

5.  **Executar Migrações do Banco de Dados:**

    - Com o banco de dados rodando (passo 4), aplique as migrações para criar as tabelas e estruturas necessárias:
      ```bash
      npm run db:migrate
      ```
      _(Este comando executa `drizzle-kit migrate` com a configuração apropriada)_

6.  **Executar o Projeto:**

    - Na raiz do projeto, inicie o servidor de desenvolvimento:
      ```bash
      npm run dev
      ```
    - Este comando utiliza o Vinxi para compilar o código e iniciar o servidor de desenvolvimento, que serve tanto o frontend quanto a API.

7.  **Acessar a Aplicação:**
    - Abra seu navegador e acesse `http://localhost:3000` (porta padrão do Vinxi, a menos que configurado de outra forma).

## Parando os Serviços

- Para parar o servidor de desenvolvimento, pressione `Ctrl + C` no terminal onde `npm run dev` está rodando.
- Para parar e remover o contêiner do banco de dados:
  ```bash
  docker compose down
  ```
- Para parar, remover o contêiner e **excluir o volume de dados** (use com cuidado!):
  ```bash
  docker compose down -v
  ```

Com estes passos, o ambiente de desenvolvimento local do Sistema de Monitoria IC deve estar configurado e rodando.
