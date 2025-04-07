# Planejamento de Bibliotecas Frontend (React) - Sistema de Monitoria IC

Este documento detalha as bibliotecas Javascript/React recomendadas para o frontend (`@frontend/`) do Sistema de Monitoria IC, com foco nos requisitos de manipulação de documentos Excel, fluxo de assinatura digital e disparo de emails (via backend), conforme as necessidades levantadas.

## Stack Principal Existente

O frontend já utiliza uma base moderna que será mantida:

*   **Framework:** React
*   **Build Tool:** Vite
*   **Linguagem:** TypeScript
*   **Estilização:** Tailwind CSS
*   **Componentes UI:** shadcn/ui (baseado em Radix UI & Tailwind)
*   **Roteamento:** React Router

## Bibliotecas Adicionais Recomendadas

Abaixo estão as bibliotecas propostas para adicionar funcionalidades específicas:

### 1. Comunicação com API e Gerenciamento de Estado do Servidor

*   **Biblioteca:** **TanStack Query (React Query)** (`@tanstack/react-query`)
*   **Propósito:** Essencial para buscar, armazenar em cache, sincronizar e atualizar dados do servidor (backend). Simplifica o tratamento de estados de loading, erro, e revalidação de dados.
*   **Passo a Passo:**
    1.  Instalar: `pnpm add @tanstack/react-query`
    2.  Configurar um `QueryClientProvider` na raiz da aplicação (ex: `app/main.tsx` ou `app/app.tsx`).
    3.  Usar hooks como `useQuery` para buscar dados (ex: listar projetos, disciplinas) e `useMutation` para enviar dados (ex: criar projeto, submeter inscrição).
*   **Observação:** Pode ser usado em conjunto com `fetch` nativo ou `axios` para realizar as requisições HTTP.

### 2. Gerenciamento de Estado Global do Cliente

*   **Biblioteca:** **Zustand** (`zustand`)
*   **Propósito:** Para gerenciar estados globais da interface que não vêm diretamente do servidor ou que precisam ser compartilhados entre componentes não relacionados (ex: estado de modais, informações do usuário logado que não mudam frequentemente).
*   **Alternativas:** React Context (para casos simples), Redux Toolkit, Jotai.
*   **Porquê Zustand?** Oferece uma API simples, mínima boilerplate, e bom desempenho.
*   **Passo a Passo:**
    1.  Instalar: `pnpm add zustand`
    2.  Criar "stores" para agrupar estados relacionados (ex: `useAuthStore`, `useUINotificationStore`).
    3.  Usar o hook gerado pela store nos componentes que precisam acessar ou modificar o estado.

### 3. Formulários

*   **Biblioteca:** **React Hook Form** (`react-hook-form`) & **Zod** (`zod`)
*   **Propósito:**
    *   `react-hook-form`: Gerenciamento eficiente e performático de formulários complexos, controle de validação e submissão.
    *   `zod`: Definição de schemas para validação de dados (tanto no frontend quanto potencialmente no backend, se usar tRPC ou compartilhar tipos). Excelente integração com TypeScript.
*   **Integração:** `shadcn/ui` é projetado para funcionar bem com React Hook Form.
*   **Passo a Passo:**
    1.  Instalar: `pnpm add react-hook-form zod @hookform/resolvers` (o último é para integrar Zod).
    2.  Definir schemas de validação com `zod` para cada formulário (ex: schema para criação de projeto).
    3.  Usar o hook `useForm` do `react-hook-form`, passando o resolver do Zod.
    4.  Integrar com os componentes de formulário do `shadcn/ui` (`Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormDescription`, `FormMessage`).

### 4. Manipulação de Arquivos Excel (.xlsx)

*   **Biblioteca:** **SheetJS (xlsx)** (`xlsx`)
*   **Propósito:** Ler dados de arquivos Excel enviados pelo usuário (upload) ou gerar arquivos Excel para download no navegador.
*   **Contexto:** Necessário para gerar as planilhas solicitadas (ex: Planilha final de detalhamento por departamento, Planilha de vagas).
*   **Passo a Passo (Geração/Download):**
    1.  Instalar: `pnpm add xlsx`
    2.  Formatar os dados da aplicação (ex: lista de projetos, vagas) em uma estrutura que a biblioteca entenda (array de arrays ou array de objetos).
    3.  Usar funções como `XLSX.utils.json_to_sheet` ou `XLSX.utils.aoa_to_sheet` para criar uma planilha.
    4.  Criar um "workbook" e adicionar a planilha a ele.
    5.  Usar `XLSX.writeFile` ou `XLSX.write` (com `file-saver` - veja abaixo) para iniciar o download no navegador.
*   **Passo a Passo (Leitura/Upload):**
    1.  Instalar: `pnpm add xlsx` (se ainda não instalado).
    2.  Obter o `File` object do input de upload.
    3.  Ler o conteúdo do arquivo como um ArrayBuffer.
    4.  Usar `XLSX.read(arrayBuffer, {type: 'buffer'})` para parsear o arquivo.
    5.  Acessar as planilhas e converter para JSON usando `XLSX.utils.sheet_to_json`.
*   **Biblioteca Auxiliar (Download):** **FileSaver.js** (`file-saver`)
    *   **Propósito:** Simplifica o processo de iniciar o download de arquivos gerados no lado do cliente.
    *   Instalar: `pnpm add file-saver @types/file-saver`
    *   Usar em conjunto com `XLSX.write` para gerar o blob do Excel e depois `saveAs(blob, "nome_arquivo.xlsx")`.

### 5. Fluxo de Assinatura de Documentos

*   **Dependência:** A escolha da biblioteca/abordagem **depende fortemente do serviço de assinatura escolhido** (DocuSign, Docuseal, ITI Gov.br, etc.).
*   **Fluxo Típico (Frontend):**
    1.  **Iniciar Assinatura:** O usuário clica em um botão (ex: "Assinar Proposta"). O frontend faz uma chamada à API do *backend*.
    2.  **Backend:** O backend interage com a API do serviço de assinatura, enviando o documento e os signatários. Ele recebe de volta uma URL de assinatura ou informações para embutir a experiência.
    3.  **Frontend Recebe:** O backend retorna a URL/informações para o frontend.
    4.  **Exibir Assinatura:**
        *   **Opção A (Redirecionamento):** Redirecionar o usuário para a URL de assinatura.
        *   **Opção B (Embedding/Iframe):** Se o serviço permitir, exibir a interface de assinatura dentro de um `<iframe>` na própria aplicação.
        *   **Opção C (Componente React):** Alguns serviços (como Docuseal com `@docuseal/react`) oferecem componentes React para facilitar o embedding.
    5.  **Verificar Status:** Periodicamente (ou via WebSockets/Webhooks configurados no backend), o frontend consulta o backend para verificar o status da assinatura (pendente, concluído, recusado) e atualiza a UI.
*   **Bibliotecas Potenciais (Exemplos):**
    *   `@docuseal/react` (Se usar Docuseal)
    *   SDK específico do provedor (verificar documentação se usar DocuSign, etc.)
    *   *Nenhuma biblioteca específica* se for apenas redirecionamento ou iframe simples.
*   **Ação:** Pesquisar o SDK/componente React do serviço de assinatura *após* ele ser definido.

### 6. Disparo de Emails (Resend)

*   **Abordagem:** O envio de emails com Resend (ou qualquer serviço similar que use chaves de API secretas) **DEVE** ser feito exclusivamente pelo **backend** (`@backend/`).
*   **Responsabilidade do Frontend:**
    1.  O usuário realiza uma ação que dispara um email (ex: Professor clica em "Notificar Resultados" na Fase 3).
    2.  O frontend faz uma chamada para um endpoint específico no backend (ex: `POST /projects/:id/notify-results`).
    3.  Nenhum dado sensível (como chave de API do Resend) é manipulado ou armazenado no frontend.
*   **Bibliotecas Frontend Necessárias:** Nenhuma específica para Resend. Apenas a biblioteca de comunicação com API (`TanStack Query` + `fetch`/`axios`) para chamar o endpoint do backend.

### 7. Notificações / Toasts

*   **Biblioteca:** **Sonner** (`sonner`) (Já incluído/usado por `shadcn/ui`)
*   **Propósito:** Exibir notificações não-bloqueantes para o usuário (ex: "Projeto salvo com sucesso", "Erro ao enviar inscrição").
*   **Uso:** Importar e usar a função `toast()` fornecida pelo `sonner` (ou wrapper do `shadcn/ui`).

## Passo a Passo da Instalação (Bibliotecas Novas)

Execute no terminal, dentro do diretório `apps/frontend`:

```bash
# 1. TanStack Query (React Query)
pnpm add @tanstack/react-query

# 2. Zustand (State Management)
pnpm add zustand

# 3. React Hook Form + Zod
pnpm add react-hook-form zod @hookform/resolvers

# 4. SheetJS (xlsx) + FileSaver
pnpm add xlsx file-saver
pnpm add -D @types/file-saver # Tipos para FileSaver

# 5. Assinatura (Exemplo Docuseal - Instalar APENAS se for usar)
# pnpm add @docuseal/react

# (Nenhuma lib frontend específica para Resend)
```

## Considerações Adicionais

*   **Tipagem:** Aproveitar ao máximo o TypeScript para garantir a segurança de tipos ao usar essas bibliotecas.
*   **Testes:** Considerar adicionar testes unitários/integração para hooks e lógica complexa envolvendo essas bibliotecas (ex: usando React Testing Library, Vitest).
*   **Performance:** Monitorar o tamanho do bundle e o desempenho, especialmente ao lidar com manipulação de arquivos no cliente. 