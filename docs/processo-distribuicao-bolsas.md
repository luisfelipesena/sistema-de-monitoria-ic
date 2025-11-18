# Processo Manual de Distribuição de Bolsas

Este documento descreve o processo completo de distribuição de bolsas de monitoria no Instituto de Computação (IC) da UFBA, desde a publicação dos resultados pela PROGRAD até a alocação no sistema pelo administrador.

## Visão Geral do Processo

O processo de distribuição de bolsas segue um fluxo institucional que acontece **fora do sistema**, envolvendo múltiplos atores e etapas de decisão. O sistema de monitoria serve como ferramenta para **replicar** as decisões tomadas pela comissão, não para tomá-las.

**Fluxo Principal**: PROGRAD → Instituto → Departamento → Comissão → Admin

```
PROGRAD publica resultado
    ↓
Diretor do Instituto conversa com chefe de departamento
    ↓
Chefe de departamento conversa com comissão de monitoria
    ↓
Comissão define distribuição entre disciplinas
    ↓
Admin replica números no sistema
```

## Etapas Detalhadas

### Etapa 1: PROGRAD Publica Resultado

**Ator**: PROGRAD (Pró-Reitoria de Graduação)

**Responsabilidade**: 
- Analisa planilha de projetos aprovados enviada pelo Instituto
- Define total de bolsas disponíveis para cada instituto
- Publica resultado via e-mail geral para toda UFBA

**Quando acontece**: Após análise dos projetos de monitoria aprovados

---

### Etapa 2: Diretor do Instituto Conversa com Chefe de Departamento

**Ator**: Diretor do Instituto de Computação (IC)

**Responsabilidade**:
- Recebe informação sobre total de bolsas disponíveis para o IC
- Conversa com chefes de departamento (DCI vs DCC) sobre divisão de bolsas
- Define distribuição inicial entre departamentos

**Quando acontece**: Imediatamente após publicação pela PROGRAD

**Observação**: A divisão entre DCI (Departamento de Ciência da Computação) e DCC (Departamento de Computação e Informática) pode variar conforme decisão institucional.

---

### Etapa 3: Chefe de Departamento Conversa com Comissão

**Ator**: Chefe do Departamento (DCI ou DCC)

**Responsabilidade**:
- Recebe informação sobre total de bolsas alocadas para o departamento
- Conversa com comissão de monitoria do departamento
- Discute distribuição de bolsas entre as disciplinas/projetos aprovados

**Quando acontece**: Após definição da divisão entre departamentos

---

### Etapa 4: Comissão Define Distribuição

**Ator**: Comissão de Monitoria do Departamento

**Responsabilidade**:
- Analisa projetos aprovados no departamento
- Define quantas bolsas cada disciplina/projeto receberá
- Considera critérios como: número de vagas solicitadas, relevância da disciplina, histórico do projeto

**Quando acontece**: Após reunião com chefe de departamento

**Resultado**: Lista de projetos com número de bolsas alocadas por cada um

---

### Etapa 5: Admin Replica Números no Sistema

**Ator**: Administrador do Sistema

**Responsabilidade**:
- Recebe informação da comissão sobre distribuição de bolsas
- Define no sistema o total de bolsas PROGRAD informado
- Aloca bolsas por projeto aprovado conforme decisão da comissão
- O sistema valida que a soma não excede o total PROGRAD

**Quando acontece**: Após definição pela comissão

**Importante**: O admin **não decide** a distribuição - apenas **replica** no sistema as decisões já tomadas pela comissão.

---

## Papel do Sistema

O sistema de monitoria **não substitui** o processo manual de decisão. Seu papel é:

1. **Armazenar** o total de bolsas PROGRAD informado
2. **Validar** que a alocação não excede o total oficial
3. **Replicar** as decisões da comissão no ambiente digital
4. **Notificar** professores sobre bolsas alocadas
5. **Facilitar** o gerenciamento de vagas voluntárias adicionais

**O processo de decisão acontece fora do sistema**, através de reuniões e discussões entre os atores institucionais.

---

## Relação com Limites PROGRAD

### Validação de Limites

O sistema implementa validação rigorosa para garantir que:

- A soma de todas as bolsas alocadas **nunca exceda** o total informado pela PROGRAD
- O admin seja **alertado** quando tentar alocar mais bolsas do que o disponível
- O **controle** seja mantido em tempo real (total PROGRAD, alocadas, restantes)

### Campos no Sistema

- **Total PROGRAD**: Total de bolsas informado pela PROGRAD (definido pelo admin)
- **Bolsas Alocadas**: Soma de todas as bolsas alocadas por projeto
- **Bolsas Restantes**: Diferença entre total PROGRAD e alocadas

### Fluxo de Validação

1. Admin define total PROGRAD no sistema
2. Admin aloca bolsas por projeto conforme decisão da comissão
3. Sistema valida automaticamente: `alocadas ≤ total PROGRAD`
4. Se exceder, sistema bloqueia a operação e exibe erro
5. Admin ajusta alocações até respeitar o limite

---

## Responsabilidades por Ator

### PROGRAD
- Analisar projetos aprovados
- Definir total de bolsas por instituto
- Publicar resultado oficial

### Diretor do Instituto
- Receber informação da PROGRAD
- Coordenar divisão entre departamentos
- Garantir transparência no processo

### Chefe de Departamento
- Receber informação do diretor
- Coordenar com comissão de monitoria
- Validar distribuição proposta

### Comissão de Monitoria
- Analisar projetos aprovados
- Definir distribuição de bolsas por disciplina
- Considerar critérios acadêmicos e institucionais

### Administrador do Sistema
- Replicar decisões da comissão no sistema
- Validar limites PROGRAD
- Notificar professores sobre alocações
- Garantir integridade dos dados

---

## Variações entre Departamentos

O processo pode apresentar variações entre departamentos:

- **DCI (Departamento de Ciência da Computação)**: Pode ter processos específicos de distribuição
- **DCC (Departamento de Computação e Informática)**: Pode ter processos específicos de distribuição

A documentação deve ser consultada junto à comissão de cada departamento para entender variações específicas.

---

## Quando Realizar a Alocação no Sistema

O admin deve realizar a alocação no sistema **apenas após**:

1. ✅ PROGRAD ter publicado o resultado oficial
2. ✅ Diretor do Instituto ter definido divisão entre departamentos
3. ✅ Chefe de departamento ter coordenado com a comissão
4. ✅ Comissão ter definido a distribuição final

**Não deve** alocar bolsas antes dessas etapas, pois isso pode não refletir as decisões institucionais corretas.

---

## Referências

- **FASE 3**: Alocação de Bolsas e Edital Interno DCC (docs/Final Version.txt)
- **TODO.md**: Tarefa de documentação do processo (linhas 197-203)
- **Sistema**: Página de Alocação de Bolsas (`/home/admin/scholarship-allocation`)

---

## Atualizações

Este documento deve ser revisado periodicamente para refletir mudanças no processo institucional. Última atualização: Janeiro 2025.

