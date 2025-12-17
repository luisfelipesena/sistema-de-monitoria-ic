# Queries no Banco de Produção

## Conexão

O acesso ao banco de produção é feito via SSH + comando `postgres:connect` do Dokku.

### Configuração

- **Host:** `200.128.51.137`
- **Porta SSH:** `9999`
- **Usuário:** `dokku`
- **App:** `sistema-de-monitoria`
- **Banco:** `sistema_de_monitoria`

### Comando Base

```bash
ssh -p 9999 dokku@200.128.51.137 "postgres:connect sistema-de-monitoria"
```

Isso abre um terminal interativo do `psql`.

### Query Única (não-interativo)

```bash
ssh -p 9999 dokku@200.128.51.137 "postgres:connect sistema-de-monitoria" <<< "SELECT * FROM \"user\" LIMIT 5;"
```

### Múltiplas Queries

```bash
ssh -p 9999 dokku@200.128.51.137 "postgres:connect sistema-de-monitoria" <<< "
SELECT id, username, email, role FROM \"user\" WHERE role = 'professor';
SELECT COUNT(*) FROM projeto;
"
```

## Exemplos Úteis

### Verificar usuário por email

```bash
ssh -p 9999 dokku@200.128.51.137 "postgres:connect sistema-de-monitoria" <<< "
SELECT id, username, email, role FROM \"user\" WHERE email = 'exemplo@ufba.br';
"
```

### Verificar constraints de FK para deleção de usuário

```bash
ssh -p 9999 dokku@200.128.51.137 "postgres:connect sistema-de-monitoria" <<< "
-- Substituir USER_ID pelo id do usuário
SELECT COUNT(*) as editais_criados FROM edital WHERE criado_por_user_id = USER_ID;
SELECT COUNT(*) as templates_criados FROM projeto_template WHERE criado_por_user_id = USER_ID;
SELECT COUNT(*) as importacoes FROM importacao_planejamento WHERE importado_por_user_id = USER_ID;
SELECT COUNT(*) as atas_geradas FROM ata_selecao WHERE gerado_por_user_id = USER_ID;
SELECT COUNT(*) as projetos FROM projeto WHERE professor_responsavel_id = (SELECT id FROM professor WHERE user_id = USER_ID);
SELECT COUNT(*) as assinaturas FROM assinatura_documento WHERE user_id = USER_ID;
SELECT COUNT(*) as sessions FROM session WHERE user_id = USER_ID;
"
```

### Listar professores ativos

```bash
ssh -p 9999 dokku@200.128.51.137 "postgres:connect sistema-de-monitoria" <<< "
SELECT p.id, p.nome_completo, u.email, p.account_status
FROM professor p
JOIN \"user\" u ON p.user_id = u.id
WHERE p.account_status = 'ACTIVE'
ORDER BY p.nome_completo;
"
```

### Contar usuários por role

```bash
ssh -p 9999 dokku@200.128.51.137 "postgres:connect sistema-de-monitoria" <<< "
SELECT role, COUNT(*) FROM \"user\" GROUP BY role;
"
```

## Outros Comandos Dokku Úteis

Referência: https://graco-ufba.github.io/app/comandos-permitidos/

| Comando | Descrição |
|---------|-----------|
| `postgres:connect` | Conexão direta para SQL |
| `postgres:info` | Info do banco |
| `postgres:export APP > backup.dump` | Backup do banco |
| `postgres:import APP < backup.dump` | Restore do banco |
| `logs` | Ver logs da aplicação |
| `config:show` | Ver variáveis de ambiente |
| `ps:restart` | Reiniciar aplicação |

### Formato geral

```bash
ssh -p 9999 dokku@200.128.51.137 "<COMANDO> sistema-de-monitoria"
```

## Notas

- Sempre usar aspas duplas escapadas para nomes de tabelas reservadas (ex: `\"user\"`)
- O heredoc `<<<` permite passar queries inline
- Para queries complexas, considere usar um arquivo `.sql` local
