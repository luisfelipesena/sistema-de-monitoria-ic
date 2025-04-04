# Instalação e Execução

## Pré-requisitos

- Node.js (versão 18 ou superior)
- Docker (versão 20 ou superior)
- Pnpm (versão 9 ou superior)

## Instalação

1. Clone o repositório:

    ```bash
    git clone <url-do-repositorio>
    ```

2. Instale as dependências:

    ```bash
    pnpm install
    ```

3. Inicie o servidor:

    ```bash
    pnpm dev
    ```

4. Acesse a aplicação no navegador:

    ```bash
    http://localhost:3000
    ```

## Configuração

1. Crie um arquivo `.env` na raiz do projeto e configure as variáveis de ambiente:

    ```bash
    cp .env.example .env
    ```