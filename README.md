# Sistema de monitoria para o IC

## 📝 Descrição

Esse projeto faz parte da disciplina **IC045/MATE85 - Tópicos em Sistemas de Informação e Web**. Um sistema completo para gerenciamento do processo de monitoria no Instituto de Computação, desde o cadastro de projetos pelos docentes até a seleção de estudantes e geração de documentos.

## 🛠️ Tecnologias utilizadas

- **Gestão**: Linear
- **Front-end**: React, TailwindCSS, Shadcn/UI
- **Back-end**: NodeJS com Express
- **Banco de Dados**: PostgreSQL
- **Hospedagem**:
  - **Front-end**: Vercel
  - **Back-end**: Fly.app

## 💻 Requisitos do Sistema

<a href="https://docs.google.com/document/d/14G-kwj4GwdpCYyfQN60SjJtvp3tMCS7QN21ji6eBeao/edit?tab=t.0" target="_blank">Requisitos do Sistema</a>

## 🏛️ Arquitetura

## 🎨 Protótipo

[Link do Protótipo](https://www.figma.com/design/meTbBaQdqBHlvtzBEb9ehF/Sistema-de-Monitoria-IC?node-id=0-1&t=PmIFftLr23foR8ZG-1)

## 🌐 Ambientes
- Gerenciamento de Tasks: [Linear](https://linear.app/mate85-2025-1/team/MAT/active)

## 📝 Licença

Este projeto está licenciado sob a

## 👥 Equipe

- **Antoniel Magalhães Sousa** - [antoniels@ufba.br](mailto:antoniels@ufba.br)
- **Caio Gomes de Mello** - [caiomello@ufba.br](mailto:caiomello@ufba.br)
- **Caio Hebert Souza Viana** - [caioviana@ufba.br](mailto:caioviana@ufba.br)
- **Ícaro Albuquerque baliza Fernandes** - [icaro.baliza@ufba.br](mailto:icaro.baliza@ufba.br)
- **Igor Prado Teixeira Borja** - [igorborja@ufba.br](mailto:igorborja@ufba.br)
- **João Gabriel Batista dos Reis** - [j.gabriel@ufba.br](mailto:j.gabriel@ufba.br)
- **João Leahy** - [joao.leahy@ufba.br](mailto:joao.leahy@ufba.br)
- **João Silva Soares** - [JSSacademica@proton.me](mailto:JSSacademica@proton.me)
- **Lucas Perrone Ramos** - [lucaspramos21@gmail.com](mailto:lucaspramos21@gmail.com)
- **Luis André Bertoli Lima** - [luisbertoli@ufba.br](mailto:luisbertoli@ufba.br)
- **Luis Felipe Sena** - [luis.sena@ufba.br](mailto:luis.sena@ufba.br)
- **Luisa Coutinho Coelho** - [luisacoelho@ufba.br](mailto:luisacoelho@ufba.br)
- **Maria Fernanda Pinto da Fonseca** - [nandamfpf@hotmail.com](mailto:nandamfpf@hotmail.com)
- **Matheus Pereira dos Passos Oliveira** - [matheus.oliveiradesenv@proton.me](mailto:matheus.oliveiradesenv@proton.me)
- **Ronaldo Paulo Freire Junior** - [ronaldopaulo21@gmail.com](mailto:ronaldopaulo21@gmail.com)

## 🚀 Instalação e Execução

### Programas necessários

- Git, Node e (Docker ou PostgreSQL)
  - é Recomendado o docker para a emulação do banco de dados, mas é possível usar o PostgreSQL

### Pré-requisitos

Certifique-se de ter os seguintes programas instalados:

- **Git**: [Instalação do Git](https://git-scm.com/downloads)
- **Node.js**: [Instalação do Node.js](https://nodejs.org/)
- **Docker** (recomendado) ou **PostgreSQL**: [Instalação do Docker](https://www.docker.com/products/docker-desktop) | [Instalação do PostgreSQL](https://www.postgresql.org/download/)

#### Como instalar

Windows:

- Git: Acesse https://git-scm.com/download/win, baixe o instalador, execute-o e siga as instruções.
- Node: Vá em https://nodejs.org, escolha a versão LTS, baixe o instalador, execute-o e conclua a instalação.
- Docker: Acesse https://www.docker.com/products/docker-desktop, baixe o Docker Desktop (necessita Windows 10 com WSL2 habilitado) e siga as orientações do instalador.

Linux (considerando distribuições baseadas em Debian/Ubuntu):

- Git: Abra o terminal e execute: sudo apt update && sudo apt install git.
- Node: Atualize o sistema e instale o Node.js e o npm com: sudo apt update && sudo apt install nodejs npm. Alternativamente, use o NodeSource ou o nvm para versões mais recentes.
- Docker: Siga os passos oficiais - remova versões antigas (se houver), adicione a chave GPG e o repositório oficial e instale com: sudo apt update && sudo apt install docker-ce docker-ce-cli containerd.io.

### Instalação

1. Clone o repositório:

   ```bash
   git clone https://github.com/seu-usuario/sistema-de-monitoria-ic.git
   cd sistema-de-monitoria-ic
   ```

2. Instale as dependências:

   ```bash
   npm install
   ```

### Configuração do Banco de Dados

1. **Usando Docker** (recomendado):

   - Inicie o container do PostgreSQL:

     ```bash
     npm run docker:up
     ```

   - Verifique se o banco de dados está ativo:

     ```bash
     npm run db:check
     ```

2. **Usando PostgreSQL local**:

   - Certifique-se de que o PostgreSQL está rodando localmente.
   - Configure as variáveis de ambiente no arquivo `.env` conforme o `.env.example`.

### Execução do Projeto

1. Inicie o servidor de desenvolvimento:

   ```bash
   npm run dev
   ```

2. Acesse o front-end no navegador:

   ```
   http://localhost:5173
   ```

3. O back-end estará disponível em:

   ```
   http://localhost:3000
   ```

## 🚢 Deployment

O projeto é implantado em dois serviços separados no Dokku:

### Front-end

O front-end está hospedado em `sistema-de-monitoria`.

Para fazer o deploy do front-end:

```bash
npm run deploy:frontend
```

Este comando cria um repositório Git temporário contendo apenas os arquivos do front-end, configura o Dockerfile correto e faz o push para o Dokku.

### Back-end (API)

O back-end está hospedado em `sistema-de-monitoria-api`. 

Para fazer o deploy do back-end:

```bash
npm run deploy:backend
```

Este comando cria um repositório Git temporário contendo apenas os arquivos do back-end, configura o Dockerfile correto e faz o push para o Dokku.

### Configuração do Dokku

Antes do primeiro deploy, certifique-se de que as aplicações estão configuradas no Dokku:

```bash
# Configurar a aplicação de front-end
dokku apps:create sistema-de-monitoria
dokku config:set sistema-de-monitoria VITE_API_URL=https://api.dominio.com

# Configurar a aplicação de back-end
dokku apps:create sistema-de-monitoria-api
dokku postgres:create sistema-de-monitoria-db
dokku postgres:link sistema-de-monitoria-db sistema-de-monitoria-api
dokku config:set sistema-de-monitoria-api DATABASE_URL=... CAS_SERVICE_URL=... NODE_ENV=production
```
