# Planejamento de Bibliotecas Frontend (React) - Sistema de Monitoria IC

Este documento detalha as bibliotecas Javascript/React recomendadas e utilizadas no Sistema de Monitoria IC, com foco nos requisitos atuais e funcionalidades planejadas, como manipulação de documentos e disparo de emails (via backend).

## Stack Principal Utilizada

A aplicação utiliza uma base moderna:

- **Framework:** React
- **Build Tool / Server:** Vinxi
- **Linguagem:** TypeScript
- **Estilização:** Tailwind CSS
- **Componentes UI:** shadcn/ui (baseado em Radix UI & Tailwind)
- **Roteamento:** TanStack Router
- **ORM / Banco de Dados:** Drizzle ORM / PostgreSQL
- **Autenticação:** Lucia Auth

## Bibliotecas Adicionais Utilizadas / Planejadas

Abaixo estão as bibliotecas chave para funcionalidades específicas:

### 1. Comunicação com API e Gerenciamento de Estado do Servidor

- **Biblioteca:** **TanStack Query (React Query)** (`@tanstack/react-query`)
- **Propósito:** Essencial para buscar, armazenar em cache, sincronizar e atualizar dados da API interna (servida pelo Vinxi). Simplifica o tratamento de estados de loading, erro, e revalidação de dados.
- **Passo a Passo:**
  1.  Instalar: `npm install @tanstack/react-query` (Já instalado)
  2.  Configurar um `QueryClientProvider` na raiz da aplicação (ex: `src/client.tsx` ou onde a raiz do React é renderizada).
  3.  Usar hooks como `useQuery` para buscar dados (ex: listar projetos, disciplinas) e `useMutation` para enviar dados (ex: criar projeto, submeter inscrição) chamando os endpoints da API interna.
- **Observação:** A comunicação com a API interna é feita geralmente através de `fetch` dentro dos hooks do TanStack Query.

### 2. Formulários (Planejado/Recomendado)

- **Bibliotecas:** **React Hook Form** (`react-hook-form`) & **Zod** (`zod`)
- **Propósito:**
  - `react-hook-form`: Gerenciamento eficiente e performático de formulários complexos, controle de validação e submissão.
  - `zod`: Definição de schemas para validação de dados (tanto no frontend quanto potencialmente no backend, nos handlers da API). Excelente integração com TypeScript.
- **Integração:** `shadcn/ui` é projetado para funcionar bem com React Hook Form.
- **Status Atual:** **Não instaladas.** Se/quando necessário para formulários complexos:
- **Passo a Passo (se implementado):**
  1.  Instalar: `npm install react-hook-form zod @hookform/resolvers` (o último é para integrar Zod).
  2.  Definir schemas de validação com `zod` para cada formulário.
  3.  Usar o hook `useForm` do `react-hook-form`, passando o resolver do Zod.
  4.  Integrar com os componentes de formulário do `shadcn/ui` (`Form`, `FormField`, etc. - verificar documentação `shadcn/ui`).

### 3. Manipulação de Arquivos Excel (.xlsx) (Planejado)

- **Biblioteca:** **SheetJS (xlsx)** (`xlsx`)
- **Propósito:** Ler dados de arquivos Excel enviados pelo usuário (upload) ou gerar arquivos Excel para download no navegador.
- **Contexto:** Necessário para gerar as planilhas solicitadas (ex: Planilha final de detalhamento por departamento, Planilha de vagas).
- **Status Atual:** **Não instalada.** Se/quando necessário:
- **Passo a Passo (Geração/Download - se implementado):**
  1.  Instalar: `npm install xlsx file-saver` (e `npm install -D @types/file-saver`).
  2.  Formatar os dados da aplicação (ex: lista de projetos, vagas).
  3.  Usar funções como `XLSX.utils.json_to_sheet`.
  4.  Criar um "workbook" e adicionar a planilha.
  5.  Usar `XLSX.write` com `file-saver` (`saveAs(blob, "nome_arquivo.xlsx")`) para iniciar o download.
- **Passo a Passo (Leitura/Upload - se implementado):**
  1.  Instalar: `npm install xlsx`.
  2.  Obter o `File` object do input de upload.
  3.  Ler o conteúdo do arquivo como um ArrayBuffer.
  4.  Usar `XLSX.read(arrayBuffer, {type: 'buffer'})` para parsear.
  5.  Converter para JSON usando `XLSX.utils.sheet_to_json`.

### 4. Fluxo de Assinatura de Documentos (Planejado)

- **Dependência:** A escolha da biblioteca/abordagem **depende fortemente do serviço de assinatura escolhido** (DocuSign, Docuseal, ITI Gov.br, etc.).
- **Fluxo Típico (Componente Cliente e Servidor):**
  1.  **Iniciar Assinatura:** O usuário clica em um botão (ex: "Assinar Proposta"). O componente cliente faz uma chamada à API interna.
  2.  **Lógica no Servidor:** O handler da API no servidor (`src/server/...`) interage com a API do serviço de assinatura, enviando o documento e os signatários. Ele recebe de volta uma URL de assinatura ou informações para embutir a experiência.
  3.  **Cliente Recebe:** O handler da API retorna a URL/informações para o componente cliente.
  4.  **Exibir Assinatura (Cliente):**
      - **Opção A (Redirecionamento):** Redirecionar o usuário para a URL de assinatura.
      - **Opção B (Embedding/Iframe):** Se o serviço permitir, exibir a interface de assinatura dentro de um `<iframe>`.
      - **Opção C (Componente React):** Alguns serviços (como Docuseal com `@docuseal/react`) oferecem componentes React.
  5.  **Verificar Status:** Periodicamente (ou via WebSockets/Webhooks configurados no backend), o cliente consulta a API interna para verificar o status da assinatura.
- **Bibliotecas Potenciais (Exemplos):**
  - `@docuseal/react` (Se usar Docuseal)
  - SDK específico do provedor.
  - _Nenhuma biblioteca específica_ se for apenas redirecionamento ou iframe simples.
- **Ação:** Pesquisar o SDK/componente React do serviço de assinatura _após_ ele ser definido.

### 5. Disparo de Emails (Nodemailer) (Planejado)

- **Abordagem:** O envio de emails com Nodemailer (ou qualquer serviço similar que use chaves de API secretas) **DEVE** ser feito exclusivamente pela **lógica do servidor** (`src/server/...`).
- **Responsabilidade do Cliente (Componentes React):**
  1.  O usuário realiza uma ação que dispara um email (ex: Professor clica em "Notificar Resultados").
  2.  O componente cliente faz uma chamada para um endpoint específico na API interna (ex: `POST /api/projects/:id/notify-results`) usando `useMutation` do TanStack Query.
  3.  Nenhum dado sensível (como chave de API do Nodemailer) é manipulado ou armazenado no código do cliente.
- **Bibliotecas Cliente Necessárias:** Nenhuma específica para Nodemailer. Apenas `TanStack Query` + `fetch` para chamar o endpoint da API.

### 6. Notificações / Toasts

- **Biblioteca:** **Radix UI Toast** (`@radix-ui/react-toast`) (Utilizada via `shadcn/ui`)
- **Propósito:** Exibir notificações não-bloqueantes para o usuário (ex: "Projeto salvo com sucesso", "Erro ao enviar inscrição").
- **Uso:** Utilizar o componente `<Toast>` e o hook `useToast` (ou similar) exportados pelo `shadcn/ui` (verificar `src/components/ui/toast.tsx` e `src/components/ui/use-toast.ts` ou equivalentes).

## Considerações Adicionais

- **Tipagem:** Aproveitar ao máximo o TypeScript para garantir a segurança de tipos ao usar essas bibliotecas.
- **Testes:** Considerar adicionar testes unitários/integração para handlers da API e lógica de negócios no servidor (`src/server`). Implementar testes de componentes e ponta a ponta para o cliente (`src/components`, `src/routes`). Utilizar Vitest (já configurado).
- **Performance:** Monitorar o tamanho do bundle e o desempenho, especialmente ao adicionar novas dependências ou implementar manipulação de arquivos no cliente.
