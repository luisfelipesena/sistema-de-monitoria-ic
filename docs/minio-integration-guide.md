# Guia de Integração: Minio para Armazenamento de Arquivos

Este guia detalha como configurar e utilizar a instância Minio (`sistema-de-monitoria-minio`) provisionada via Dokku para armazenar e recuperar arquivos (como PDFs de propostas, editais, atas) a partir da aplicação principal (`sistema-de-monitoria`).

## Pré-requisitos

1.  **Instância Minio:** Uma instância Minio funcional (`sistema-de-monitoria-minio`) já deve estar implantada no Dokku, conforme descrito em `docs/infrastructure-setup.md`.
2.  **Credenciais de Acesso:** Você precisará das seguintes informações da instância Minio (geralmente configuradas como variáveis de ambiente no app Dokku `sistema-de-monitoria-minio`):
    - Endpoint/URL da instância Minio (ex: `minio.app.ic.ufba.br` ou similar)
    - Porta da API (geralmente `9000`, mas pode ser exposta de forma diferente pelo Dokku/proxy)
    - Chave de Acesso (Access Key ID / `MINIO_ROOT_USER`)
    - Chave Secreta (Secret Access Key / `MINIO_ROOT_PASSWORD`)
    - Se o acesso é via HTTPS (`true`) ou HTTP (`false`).

## Configuração no Backend (`sistema-de-monitoria`)

A interação com o Minio deve ocorrer **exclusivamente no backend** por razões de segurança.

### 1. Variáveis de Ambiente

Adicione as seguintes variáveis ao arquivo `.env` da aplicação `sistema-de-monitoria` (ou configure-as diretamente no ambiente Dokku):

```dotenv
# Minio Configuration
MINIO_ENDPOINT="your-minio-instance.app.ic.ufba.br" # Substitua pelo endpoint correto
MINIO_PORT=9000                                    # Ajuste se a porta exposta for diferente
MINIO_ACCESS_KEY="your_minio_access_key"           # Substitua pela chave de acesso
MINIO_SECRET_KEY="your_minio_secret_key"           # Substitua pela chave secreta
MINIO_USE_SSL=true                                 # Defina como true se usar HTTPS, false para HTTP
MINIO_BUCKET_NAME="monitoria-arquivos"             # Nome do bucket a ser usado
```

**Importante:** Nunca exponha `MINIO_ACCESS_KEY` ou `MINIO_SECRET_KEY` no frontend.

### 2. Instalar Cliente Minio JS

Instale a biblioteca oficial do Minio para JavaScript/Node.js:

```bash
npm install minio
```

### 3. Inicializar Cliente Minio

Crie um serviço ou módulo no backend (`src/server/lib/minio.ts` por exemplo) para inicializar e exportar o cliente Minio:

```typescript
// src/server/lib/minio.ts
import * as Minio from 'minio';
import { env } from './env'; // Assumindo que você tem um helper para env vars

const minioClient = new Minio.Client({
  endPoint: env.MINIO_ENDPOINT,
  port: env.MINIO_PORT,
  useSSL: env.MINIO_USE_SSL,
  accessKey: env.MINIO_ACCESS_KEY,
  secretKey: env.MINIO_SECRET_KEY,
});

export const bucketName = env.MINIO_BUCKET_NAME;

// Função para garantir que o bucket existe
export async function ensureBucketExists(bucket: string) {
  try {
    const exists = await minioClient.bucketExists(bucket);
    if (!exists) {
      console.log(`Bucket ${bucket} does not exist. Creating...`);
      await minioClient.makeBucket(bucket); // Adicione região se necessário: await minioClient.makeBucket(bucket, 'us-east-1');
      console.log(`Bucket ${bucket} created successfully.`);
      // Opcional: Definir política de acesso público para leitura (se necessário)
      // const policy = JSON.stringify({...});
      // await minioClient.setBucketPolicy(bucket, policy);
    }
  } catch (error) {
    console.error('Error checking or creating bucket:', error);
    throw error; // Propagar o erro para tratamento superior
  }
}

export default minioClient;

// Chame ensureBucketExists(bucketName) na inicialização do seu servidor
// ou antes da primeira operação que necessite do bucket.
```

## Gerenciamento do Bucket

- **Nome:** Use um nome de bucket dedicado (ex: `monitoria-arquivos`, definido em `MINIO_BUCKET_NAME`).
- **Criação:** O bucket precisa existir antes de fazer uploads.
  - **Manual:** Crie o bucket usando a interface web do Minio ou o cliente `mc`.
  - **Programática:** Use a função `ensureBucketExists` (mostrada acima) na inicialização do servidor backend para criar o bucket se ele não existir.

## Fluxo de Upload de Arquivos

1.  **Frontend:** O usuário seleciona um arquivo (PDF) em um formulário. O formulário envia o arquivo para um endpoint da API backend (via `fetch` ou `useMutation` do TanStack Query), geralmente como `multipart/form-data`.
2.  **Backend (API Endpoint):**

    - Recebe a requisição com o arquivo. Use um middleware ou biblioteca (como `multer` se estiver usando Express/Connect-style middleware, ou o handler nativo do seu framework) para processar `multipart/form-data`.
    - Gere um nome único para o objeto no Minio (ex: `propostas/${projectId}/${uuidv4()}.pdf`). Isso evita colisões de nome.
    - Use o cliente Minio para fazer o upload:

      ```typescript
      import minioClient, { bucketName } from '../lib/minio';
      import { v4 as uuidv4 } from 'uuid'; // npm install uuid @types/uuid

      // ... dentro do seu handler de API ...
      const file = request.file; // Objeto do arquivo recebido (ex: de multer)
      const projectId = request.params.projectId; // Exemplo
      const originalName = file.originalname;
      const mimeType = file.mimetype;
      const fileSize = file.size;

      const objectName = `propostas/${projectId}/${uuidv4()}-${originalName}`; // Exemplo de nome único

      try {
        const etag = await minioClient.putObject(
          bucketName,
          objectName,
          file.buffer, // Ou file.stream, dependendo de como você recebe
          { 'Content-Type': mimeType }
        );

        // 3. Salvar Metadados no Banco de Dados:
        // Armazene informações sobre o arquivo no seu DB PostgreSQL:
        // - objectName (o caminho/nome no Minio)
        // - originalName
        // - mimeType
        // - fileSize
        // - etag (opcional, para validação)
        // - ID da entidade relacionada (ex: projectId, userId)
        // - data de upload, etc.
        // Ex: await db.insert(fileMetadataTable).values({ objectName, originalName, ... });

        // Retorne sucesso para o frontend, talvez com o ID do metadado no DB
        return { success: true, fileId: /* ID do DB */ };

      } catch (err) {
        console.error("Error uploading file to Minio:", err);
        // Retorne erro para o frontend
        return { success: false, error: "Failed to upload file" };
      }
      ```

3.  **Banco de Dados:** Armazene a referência ao arquivo (`objectName`) e outros metadados relevantes (nome original, tipo, tamanho, ID da entidade relacionada) na sua base de dados PostgreSQL. **Não armazene o binário do arquivo no DB.**

## Fluxo de Acesso a Arquivos (Visualização/Download)

Para permitir que os usuários visualizem ou baixem arquivos de forma segura sem expor as credenciais do Minio, use **URLs Pré-Assinadas (Presigned URLs)**.

1.  **Frontend:** O usuário clica em um link/botão para ver/baixar um arquivo. O frontend chama um endpoint da API backend, passando o identificador único do arquivo (ex: o ID da tabela de metadados do DB).
2.  **Backend (API Endpoint):**

    - Recebe a requisição com o ID do arquivo.
    - Busca os metadados do arquivo no banco de dados usando o ID (incluindo o `objectName`).
    - Verifique as permissões do usuário (ex: só o professor responsável pode ver a ata).
    - Gere uma URL pré-assinada usando o cliente Minio:

      ```typescript
      import minioClient, { bucketName } from '../lib/minio';

      // ... dentro do seu handler de API ...
      const fileId = request.params.fileId;

      // 1. Buscar metadados do DB
      const fileMetadata = await db.query.fileMetadataTable.findFirst({
        where: eq(fileMetadataTable.id, fileId),
      });

      if (!fileMetadata) {
        // Retornar 404 Not Found
      }

      // 2. Verificar permissões (lógica da sua aplicação)
      // if (!userHasPermission(currentUser, fileMetadata)) {
      //   // Retornar 403 Forbidden
      // }

      const objectName = fileMetadata.objectName;
      const expirySeconds = 60 * 5; // URL válida por 5 minutos

      try {
        const presignedUrl = await minioClient.presignedGetObject(
          bucketName,
          objectName,
          expirySeconds,
        );

        // 3. Retornar a URL para o Frontend
        // Opção A: Redirecionar diretamente (para visualização simples)
        // return response.redirect(presignedUrl);

        // Opção B: Retornar a URL como JSON (mais flexível para o frontend)
        return {
          success: true,
          url: presignedUrl,
          originalName: fileMetadata.originalName,
        };
      } catch (err) {
        console.error('Error generating presigned URL:', err);
        // Retornar erro
        return { success: false, error: 'Failed to get file URL' };
      }
      ```

3.  **Frontend:**
    - **Para Visualização (PDF):** Recebe a URL pré-assinada. Pode:
      - Abrir a URL em uma nova aba (`window.open(url)`).
      - Embutir em um `<iframe>`: `<iframe src={url} width="100%" height="600px"></iframe>`.
      - Usar uma biblioteca de visualização de PDF que aceite uma URL.
    - **Para Download:** Recebe a URL pré-assinada e o nome original. Use um link `<a>`:
      ```jsx
      <a href={presignedUrl} download={originalName}>
        Baixar {originalName}
      </a>
      ```

## Considerações de Segurança

- **Credenciais:** Mantenha as chaves do Minio seguras no backend (variáveis de ambiente).
- **Permissões de API:** Proteja os endpoints da API de upload e acesso a arquivos com autenticação e autorização adequadas (verificando roles e propriedade dos recursos).
- **URLs Pré-Assinadas:** Use expirações curtas para as URLs pré-assinadas para limitar o tempo de acesso. Elas concedem acesso direto ao objeto no Minio, bypassando sua lógica de aplicação naquele momento.
- **Políticas de Bucket:** Considere configurar políticas no bucket Minio se precisar de regras de acesso mais complexas (embora as URLs pré-assinadas geralmente sejam suficientes quando controladas pelo backend).
