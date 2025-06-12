# Autenticação da API - Sistema de Monitoria UFBA

Este documento descreve como usar a autenticação via API Key para acessar os endpoints da API do Sistema de Monitoria da UFBA de forma programática.

## Visão Geral

O sistema oferece duas formas de autenticação:

1. **Autenticação CAS (Web)**: Para usuários navegando pelo sistema web
2. **Autenticação via API Key**: Para integração programática e acesso aos endpoints OpenAPI

## Autenticação via API Key

### Como obter uma API Key

1. Faça login no sistema com sua conta UFBA
2. Navegue até `/home/admin/api-keys` (apenas administradores)
3. Clique em "Nova API Key"
4. Preencha:
   - **Nome**: Um nome descritivo para identificar a chave
   - **Descrição**: (Opcional) Mais detalhes sobre o uso
   - **Data de Expiração**: (Opcional) Quando a chave deve expirar
5. Clique em "Criar API Key"
6. **IMPORTANTE**: Copie a chave imediatamente - ela não será mostrada novamente

### Como usar a API Key

Você pode autenticar suas requisições de duas formas:

#### 1. Header X-API-Key (Recomendado)
```bash
curl -H "x-api-key: sua_api_key_aqui" \\
     -H "Content-Type: application/json" \\
     https://seu-dominio.com/api/openapi/endpoint
```

#### 2. Authorization Bearer
```bash
curl -H "Authorization: Bearer sua_api_key_aqui" \\
     -H "Content-Type: application/json" \\
     https://seu-dominio.com/api/openapi/endpoint
```

### Exemplos de uso

#### JavaScript/TypeScript
```javascript
const apiKey = 'sua_api_key_aqui';

// Usando fetch
const response = await fetch('/api/openapi/projeto', {
  method: 'GET',
  headers: {
    'x-api-key': apiKey,
    'Content-Type': 'application/json'
  }
});

const data = await response.json();
```

#### Python
```python
import requests

api_key = 'sua_api_key_aqui'
headers = {
    'x-api-key': api_key,
    'Content-Type': 'application/json'
}

response = requests.get('https://seu-dominio.com/api/openapi/projeto', headers=headers)
data = response.json()
```

#### PHP
```php
<?php
$api_key = 'sua_api_key_aqui';

$context = stream_context_create([
    'http' => [
        'method' => 'GET',
        'header' => [
            'x-api-key: ' . $api_key,
            'Content-Type: application/json'
        ]
    ]
]);

$response = file_get_contents('https://seu-dominio.com/api/openapi/projeto', false, $context);
$data = json_decode($response, true);
?>
```

## Documentação OpenAPI

Acesse a documentação interativa dos endpoints em:
- **Swagger UI**: `/docs`
- **Especificação JSON**: `/api/openapi-spec`

Na documentação Swagger, você pode:
1. Clicar em "Authorize" no topo da página
2. Inserir sua API Key no campo "apiKeyAuth"
3. Testar os endpoints diretamente na interface

## Gerenciamento de API Keys

### Para Administradores

Administradores podem:
- Criar API Keys para qualquer usuário
- Visualizar todas as API Keys do sistema
- Ativar/desativar chaves
- Deletar chaves não utilizadas

### Para Usuários

Usuários regulares podem:
- Criar suas próprias API Keys
- Visualizar e gerenciar apenas suas chaves
- Ativar/desativar suas chaves

## Permissões e Segurança

### Herança de Permissões
As API Keys herdam as permissões do usuário que as criou:
- **Admin**: Acesso total a todos os endpoints
- **Professor**: Acesso aos endpoints relacionados aos seus projetos
- **Student**: Acesso limitado aos endpoints de consulta

### Boas Práticas de Segurança

1. **Mantenha suas chaves seguras**: Nunca exponha API Keys em código público
2. **Use variáveis de ambiente**: Armazene chaves em variáveis de ambiente
3. **Rotacione regularmente**: Crie novas chaves e delete as antigas periodicamente
4. **Configure expiração**: Use datas de expiração para chaves temporárias
5. **Monitore uso**: Verifique regularmente quando suas chaves foram usadas

### Exemplo de configuração segura

#### .env
```bash
SISTEMA_MONITORIA_API_KEY=sua_api_key_aqui
SISTEMA_MONITORIA_BASE_URL=https://seu-dominio.com
```

#### JavaScript
```javascript
const apiConfig = {
  apiKey: process.env.SISTEMA_MONITORIA_API_KEY,
  baseUrl: process.env.SISTEMA_MONITORIA_BASE_URL,
};

// Nunca faça isso:
// const apiKey = 'sk_live_abc123...'; // ❌ Chave exposta no código
```

## Limitações e Rate Limiting

- Não há rate limiting específico para API Keys atualmente
- As mesmas limitações de negócio da aplicação web se aplicam
- Recomenda-se não fazer mais que 100 requisições por minuto

## Troubleshooting

### Erro 401 - Unauthorized
- Verifique se a API Key está sendo enviada corretamente
- Confirme se a chave não expirou
- Verifique se a chave está ativa

### Erro 403 - Forbidden
- O usuário não tem permissão para acessar o recurso
- Verifique o role do usuário proprietário da chave

### Chave não funciona
- Certifique-se de estar usando a chave completa
- Verifique se não há espaços extras no início/fim
- Confirme que a chave não foi desativada no painel administrativo

## Suporte

Para dúvidas sobre integração ou problemas com API Keys:
- Contate o administrador do sistema
- Consulte os logs do sistema para mais detalhes sobre erros
- Verifique a documentação OpenAPI para detalhes específicos dos endpoints