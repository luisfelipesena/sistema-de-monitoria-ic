# Roteiro de Demonstração - Sistema de Monitoria IC

## Fases 1 e 2 - Demonstração Cliente

---

## 📋 **PREPARAÇÃO PRÉ-DEMONSTRAÇÃO**

### Usuários de Teste Necessários
- **Admin**: admin@ufba.br
- **Professor**: professor@ufba.br  
- **Estudante**: estudante@ufba.br

### URLs Base
- **Produção**: [URL do deployment]
- **Login CAS**: Integração com autenticacao.ufba.br

---

## 🏗️ **MÓDULO 1: ESTRUTURA ADMINISTRATIVA**

### 1.1 Login e Autenticação
1. Acessar sistema via CAS UFBA
2. Demonstrar redirecionamento automático
3. Mostrar identificação de papel (Admin/Professor/Estudante)

### 1.2 Gestão de Departamentos
**Rota**: `/home/admin/departamentos`

1. **Listar Departamentos**
   - Mostrar DCC e DCI já cadastrados
   - Demonstrar tabela responsiva

2. **Criar Novo Departamento**
   - Clicar em "Novo Departamento"
   - Preencher: Nome, Código, Descrição
   - Salvar e mostrar na listagem

3. **Editar Departamento**
   - Selecionar departamento existente
   - Modificar informações
   - Demonstrar atualização em tempo real

### 1.3 Gestão de Cursos
**Rota**: `/home/admin/cursos`

1. **Listar Cursos por Departamento**
   - Filtrar por DCC/DCI
   - Mostrar cursos vinculados

2. **Criar Novo Curso**
   - Nome do curso
   - Vincular ao departamento
   - Código do curso
   - Demonstrar validação

### 1.4 Gestão de Disciplinas
**Rota**: `/home/admin/disciplinas`

1. **Visualizar Disciplinas**
   - Listar por departamento/curso
   - Mostrar código, nome, carga horária

2. **Adicionar Nova Disciplina**
   - Código da disciplina (ex: MAT001)
   - Nome da disciplina
   - Carga horária
   - Vincular ao curso
   - Pré-requisitos (se aplicável)

### 1.5 Gestão de Usuários
**Rota**: `/home/admin/users`

1. **Listar Usuários**
   - Ver todos os usuários cadastrados
   - Filtrar por tipo (Admin/Professor/Estudante)
   - Status ativo/inativo

2. **Gerenciar Professores**
   - Rota: `/home/admin/professores`
   - Promover usuário para Professor
   - Vincular a departamentos
   - Demonstrar formulário de convite

3. **Convidar Professor**
   - Rota: `/home/admin/invite-professor`
   - Enviar convite por email
   - Demonstrar template de email
   - Processo de ativação

---

## 📚 **MÓDULO 2: GESTÃO DE PROJETOS DE MONITORIA**

### 2.1 Criação de Período de Inscrição (Admin)
**Rota**: `/home/admin/edital-management`

1. **Criar Novo Período**
   - Definir semestre (ex: 2024.1)
   - Data início das inscrições
   - Data fim das inscrições
   - Data limite para seleção
   - Gerar período automaticamente

2. **Configurar Edital**
   - Upload do edital oficial (PDF)
   - Definir regras específicas
   - Publicar período

### 2.2 Alocação de Bolsas (Admin)
**Rota**: `/home/admin/scholarship-allocation`

1. **Definir Cotas por Departamento**
   - DCC: X bolsas disponíveis
   - DCI: Y bolsas disponíveis
   - Mostrar distribuição

2. **Alocar Bolsas por Projeto**
   - Listar projetos aprovados
   - Definir quantas bolsas cada projeto recebe
   - Validar não exceder cota total

### 2.3 Criação de Projeto (Professor)
**Rota**: `/home/professor/projetos/novo`

1. **Formulário de Projeto**
   - Título do projeto
   - Objetivos
   - Metodologia
   - Disciplina vinculada
   - Professor responsável
   - Professores participantes

2. **Configuração de Vagas**
   - Número de monitores bolsistas desejados
   - Número de monitores voluntários
   - Pré-requisitos para candidatos

3. **Salvar como Rascunho**
   - Demonstrar status "draft"
   - Possibilidade de editar

### 2.4 Assinatura de Projetos (Professor)
**Rota**: `/home/professor/assinatura-documentos`

1. **Assinar Projeto**
   - Visualizar PDF gerado do projeto
   - Sistema de assinatura digital
   - Confirmar assinatura
   - Status muda para "submitted"

2. **Gerenciar Assinaturas**
   - Listar projetos pendentes de assinatura
   - Histórico de assinaturas
   - Reenvio de notificações

### 2.5 Aprovação de Projetos (Admin)
**Rota**: `/home/admin/manage-projects`

1. **Listar Projetos Submetidos**
   - Filtrar por status
   - Visualizar detalhes
   - Ver documento assinado

2. **Aprovar/Rejeitar Projeto**
   - Análise do conteúdo
   - Comentários de feedback
   - Mudança de status para "approved"/"rejected"
   - Notificação automática ao professor

---

## 👥 **MÓDULO 3: PROCESSO SELETIVO**

### 3.1 Visualização de Vagas (Estudante)
**Rota**: `/home/student/vagas`

1. **Listar Projetos Disponíveis**
   - Projetos aprovados com vagas abertas
   - Filtros por departamento/disciplina
   - Detalhes do projeto e requisitos

2. **Inscrição em Projetos**
   - Rota: `/home/student/inscricao-monitoria`
   - Formulário de candidatura
   - Upload de documentos
   - Histórico acadêmico
   - Carta de motivação

### 3.2 Gestão de Candidatos (Professor)
**Rota**: `/home/professor/candidatos`

1. **Visualizar Inscrições**
   - Listar candidatos por projeto
   - Ver documentos enviados
   - Informações acadêmicas

2. **Processo de Seleção**
   - Rota: `/home/professor/grade-applications`
   - Avaliar candidatos
   - Atribuir notas/classificação
   - Seleções preliminares

3. **Ata de Seleção**
   - Rota: `/home/professor/atas-selecao`
   - Gerar ata da reunião de seleção
   - Upload da ata assinada
   - Finalizar processo seletivo

### 3.3 Publicação de Resultados (Professor)
**Rota**: `/home/professor/publicar-resultados`

1. **Definir Selecionados**
   - Escolher monitores bolsistas
   - Escolher monitores voluntários
   - Lista de espera

2. **Publicar Resultado**
   - Gerar documento de resultado
   - Envio automático de emails
   - Notificação aos candidatos

### 3.4 Visualização de Resultados (Estudante)
**Rota**: `/home/student/resultados`

1. **Ver Status das Inscrições**
   - Resultado por projeto inscrito
   - Posição na seleção
   - Próximos passos

2. **Aceitar/Recusar Monitoria**
   - Confirmar participação
   - Prazo para resposta
   - Limitação: apenas 1 bolsa por semestre

---

## 📄 **MÓDULO 4: DOCUMENTAÇÃO E TERMOS**

### 4.1 Termo de Compromisso (Professor)
**Rota**: `/home/professor/termos-compromisso`

1. **Gerar Termos**
   - Lista de monitores selecionados
   - Gerar termo individual
   - Template padronizado

2. **Gestão de Assinaturas**
   - Envio para assinatura dos monitores
   - Acompanhamento de pendências
   - Arquivo final assinado

### 4.2 Gestão de Documentos (Admin)
**Rota**: `/home/admin/files`

1. **Central de Documentos**
   - Todos os PDFs gerados
   - Projetos assinados
   - Atas de seleção
   - Termos de compromisso

2. **Sistema de Backup**
   - Integração com MinIO
   - Versionamento de documentos
   - Controle de acesso

---

## 📊 **RELATÓRIOS E ANALYTICS**

### 5.1 Dashboard Administrativo
**Rota**: `/home/admin/dashboard`

1. **Métricas Gerais**
   - Total de projetos por status
   - Número de inscrições
   - Taxa de aprovação
   - Distribuição por departamento

2. **Gráficos e Indicadores**
   - Timeline do processo
   - Comparativo entre semestres
   - Performance por departamento

### 5.2 Relatórios PROGRAD
**Rota**: `/home/admin/relatorios`

1. **Relatório de Consolidação**
   - Rota: `/home/admin/consolidacao-prograd`
   - Planilha Excel final
   - Dados por departamento
   - Monitores cadastrados

2. **Export de Dados**
   - Relatório detalhado
   - Formato padronizado PROGRAD
   - Download automático

### 5.3 Analytics Avançado
**Rota**: `/home/admin/analytics`

1. **Análise de Dados**
   - Padrões de inscrição
   - Taxa de sucesso por projeto
   - Métricas de engajamento

---

## 🔧 **FUNCIONALIDADES TÉCNICAS**

### 6.1 Gestão de API Keys
**Rota**: `/home/admin/api-keys`

1. **Criação de Chaves**
   - API keys para integrações
   - Controle de escopo
   - Monitoramento de uso

### 6.2 Templates de Projeto
**Rota**: `/home/admin/projeto-templates`

1. **Templates Padronizados**
   - Modelos por departamento
   - Estrutura pré-definida
   - Facilitar criação

### 6.3 Importação de Planejamento
**Rota**: `/home/admin/import-projects`

1. **Importação em Lote**
   - Upload de planilha
   - Criação automática de projetos
   - Validação de dados

---

## 🎯 **FLUXO COMPLETO DE DEMONSTRAÇÃO**

### Sequência Recomendada (30-45 min)

1. **Setup Inicial (5 min)**
   - Login como Admin
   - Mostrar estrutura de departamentos/cursos
   - Criar período de inscrição

2. **Fluxo Professor (10 min)**
   - Login como Professor
   - Criar projeto
   - Assinar projeto
   - Mostrar aprovação (como Admin)

3. **Fluxo Estudante (8 min)**
   - Login como Estudante
   - Ver vagas disponíveis
   - Fazer inscrição

4. **Processo Seletivo (10 min)**
   - Avaliar candidatos (Professor)
   - Publicar resultados
   - Aceitar monitoria (Estudante)

5. **Finalização (7 min)**
   - Gerar documentos finais
   - Mostrar relatórios PROGRAD
   - Dashboard de analytics

---

## ✅ **CHECKLIST PRÉ-DEMONSTRAÇÃO**

### Dados de Teste Preparados
- [ ] Departamentos: DCC, DCI
- [ ] Cursos vinculados
- [ ] Disciplinas cadastradas
- [ ] Usuários de teste criados
- [ ] Período de inscrição ativo

### Funcionalidades Testadas
- [ ] Login CAS funcionando
- [ ] Criação de projetos
- [ ] Sistema de assinatura
- [ ] Processo de inscrição
- [ ] Seleção e resultados
- [ ] Geração de relatórios

### Documentos Exemplo
- [ ] Edital de exemplo
- [ ] Projeto modelo
- [ ] Ata de seleção exemplo
- [ ] Relatório PROGRAD

---

## 🚨 **PONTOS DE ATENÇÃO**

### Durante a Demonstração
1. **Performance**: Sistema responsivo
2. **Usabilidade**: Interface intuitiva
3. **Segurança**: Controle de acesso por perfil
4. **Integração**: CAS UFBA funcionando
5. **Documentos**: PDFs gerados corretamente

### Backup Plans
- Screenshots das telas principais
- Vídeos curtos das funcionalidades críticas
- Dados de exemplo pré-carregados
- URL de staging como backup
