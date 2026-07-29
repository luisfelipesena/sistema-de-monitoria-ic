# Implementation Plan: Seleção de Datas e Horários

## Overview

Implementar as funcionalidades faltantes no fluxo de seleção de datas e horários do sistema de monitoria DCC. O trabalho segue a ordem: tipos compartilhados → service layer → tRPC routers → componentes frontend → integração PDF. TypeScript com Vitest + fast-check para testes.

## Tasks

- [x] 1. Definir tipos compartilhados e schemas de validação
  - [x] 1.1 Criar interface `SlotDataHorario` e schemas Zod em `src/types/selecao-inputs.ts`
    - Adicionar `SlotDataHorario` interface com campos `data: string` (ISO date) e `horario: string`
    - Criar `slotDataHorarioSchema` com validação regex para data e min(1) para horário
    - Criar `datasProvasDisponiveisSchema` com array min(2) max(3)
    - Exportar schemas para reuso no frontend e backend
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

  - [ ]* 1.2 Write property test: serialization round-trip (Property 1)
    - **Property 1: Slot serialization round-trip**
    - Gerar arrays de 2-3 SlotDataHorario com datas ISO válidas e horários não-vazios
    - Verificar que `JSON.parse(JSON.stringify(slots))` é deeply equal ao original
    - **Validates: Requirements 1.4**

- [x] 2. Implementar service layer para seleção de dados do projeto
  - [x] 2.1 Criar `projeto-selecao-data-service.ts` em `src/server/services/projeto/`
    - Implementar factory `createProjetoSelecaoDataService(repo)`
    - Implementar método `chooseSlot(projetoId, data, horario, userId, userRole)` com validação de membership no edital
    - Implementar método `updateVoluntarios(projetoId, value, userId, userRole)` com validação >= 0
    - Implementar método `updateSelecaoData(projetoId, pontosProva?, bibliografia?, userId, userRole)` para campos textuais
    - Implementar verificação de autorização (professor só edita próprio projeto)
    - _Requirements: 2.3, 3.2, 3.4, 4.4_

  - [x] 2.2 Criar função `parseSlots` para deserialização com fallback legado
    - Implementar em `src/server/services/edital/edital-crud-service.ts` ou utilitário dedicado
    - Aceitar formato novo (array de objetos) e formato legado (array de strings)
    - Retornar array vazio para JSON inválido ou null
    - Log warning quando formato legado é detectado
    - _Requirements: 1.4, 1.5_

  - [ ]* 2.3 Write property test: chosen slot must belong to available slots (Property 2)
    - **Property 2: Chosen slot must belong to available slots**
    - Gerar edital com slots aleatórios e testar que chooseSlot aceita somente slots existentes
    - **Validates: Requirements 2.3**

  - [ ]* 2.4 Write property test: voluntários validation non-negative integer (Property 3)
    - **Property 3: Voluntários validation (non-negative integer)**
    - Gerar inteiros arbitrários e verificar que valores >= 0 passam e negativos rejeitam
    - **Validates: Requirements 3.2, 3.4**

  - [ ]* 2.5 Write property test: template fallback for pontos de prova e bibliografia (Property 4)
    - **Property 4: Template fallback for pontos de prova and bibliografia**
    - Gerar projetos com/sem pontosProva e com/sem template defaults, verificar valor exibido
    - **Validates: Requirements 4.2, 4.3**

- [x] 3. Checkpoint - Verificar services
  - Ensure all tests pass, ask the user if questions arise.

- [x] 4. Atualizar tRPC routers para seleção
  - [x] 4.1 Expandir `src/server/api/routers/selecao/selecao.ts` com novos endpoints
    - Adicionar mutation `chooseSelecaoSlot` com input schema tipado (projetoId, data, horario)
    - Adicionar mutation `updateVoluntarios` com input schema (projetoId, voluntariosSolicitados)
    - Adicionar mutation `updateSelecaoData` com input schema (projetoId, pontosProva?, bibliografia?)
    - Conectar aos métodos do `projeto-selecao-data-service`
    - _Requirements: 2.3, 3.2, 4.4_

  - [x] 4.2 Atualizar endpoint `updateEdital` para aceitar `SlotDataHorario[]`
    - Modificar input schema do `updateEdital` no router de edital para aceitar array de objetos
    - Atualizar `edital-crud-service` para serializar `SlotDataHorario[]` ao persistir
    - Atualizar deserialização ao carregar edital (usar `parseSlots`)
    - _Requirements: 1.4, 1.5_

- [x] 5. Implementar componentes frontend do Admin
  - [x] 5.1 Criar componente `SlotDateTimePicker` em `src/components/features/edital/`
    - Renderizar lista de slots com campos DatePicker + input de horário
    - Botão "Adicionar" desabilitado quando max (3) atingido
    - Botão "Remover" desabilitado quando min (2) atingido
    - Integrar com React Hook Form via props `value`/`onChange`
    - _Requirements: 1.1, 1.2, 1.3_

  - [x] 5.2 Integrar `SlotDateTimePicker` no `EditalFormDialog`
    - Adicionar seção "Datas disponíveis para provas" no formulário existente
    - Conectar ao campo `datasProvasDisponiveis` do form schema
    - Pré-carregar slots existentes ao editar edital
    - Exibir mensagens de validação Zod (min 2, max 3)
    - _Requirements: 1.1, 1.2, 1.3, 1.5_

- [x] 6. Implementar componentes frontend do Professor
  - [x] 6.1 Criar componente `SlotSelectionModal` em `src/components/features/projeto/`
    - Radix Dialog com RadioGroup listando slots formatados (data + horário)
    - Pré-selecionar opção atual se já existe escolha
    - Botão "Confirmar" que chama `onConfirm` com slot selecionado
    - Estado loading durante mutation
    - _Requirements: 2.2, 2.4, 2.5_

  - [x] 6.2 Criar componente `DadosSelecaoSection` em `src/components/features/projeto/`
    - Card com seção "Dados da Seleção" contendo: data/horário escolhido, voluntários, pontos de prova, bibliografia
    - Botão "Definir Data da Seleção" quando não há escolha (abre SlotSelectionModal)
    - Exibir escolha atual com botão "Alterar" quando já escolhida
    - Campo voluntários editável (input numérico, min 0)
    - Campo bolsistas somente leitura (refletindo `bolsasDisponibilizadas`)
    - Textareas para pontos de prova e bibliografia (pré-preenchidos com template se disponível)
    - Botão/tooltip desabilitado se edital não tem slots configurados
    - _Requirements: 2.1, 2.4, 2.6, 3.1, 3.3, 4.1, 4.2, 4.3_

  - [x] 6.3 Integrar `DadosSelecaoSection` na página do Dashboard do Professor
    - Adicionar seção ao card/linha de cada projeto aprovado vinculado a edital interno
    - Conectar mutations tRPC (`chooseSelecaoSlot`, `updateVoluntarios`, `updateSelecaoData`)
    - Invalidar queries após mutations para atualizar UI
    - _Requirements: 4.1, 4.4_

  - [ ]* 6.4 Write unit tests for frontend components
    - Testar que SlotSelectionModal renderiza todos os slots como radio options
    - Testar que DadosSelecaoSection exibe botão "Definir Data" quando não há seleção
    - Testar que DadosSelecaoSection exibe seleção atual quando já escolhida
    - Testar botão desabilitado quando edital não tem slots configurados
    - Testar campo bolsistas é read-only
    - _Requirements: 2.1, 2.2, 2.4, 2.6, 3.3_

- [x] 7. Checkpoint - Verificar frontend
  - Ensure all tests pass, ask the user if questions arise.

- [x] 8. Integrar dados de seleção na geração de PDF
  - [x] 8.1 Atualizar mapeamento de dados no `edital-pdf-service.ts`
    - Filtrar projetos com `dataSelecaoEscolhida` não-nulo para seção 6.2.3
    - Filtrar projetos com `pontosProva`/`bibliografia` (ou template defaults) para seção 6.3
    - Mapear `voluntariosSolicitados` para `numVoluntarios` no PDF data
    - _Requirements: 5.1, 5.2, 5.3, 5.4, 5.5_

  - [ ]* 8.2 Write property test: PDF exam schedule includes exactly projetos with selection date (Property 5)
    - **Property 5: PDF exam schedule includes exactly projetos with selection date**
    - Gerar conjuntos de projetos com/sem dataSelecaoEscolhida, verificar filtro correto
    - **Validates: Requirements 5.1, 5.3**

  - [ ]* 8.3 Write property test: PDF section 6.3 includes exactly projetos with pontos or bibliografia (Property 6)
    - **Property 6: PDF section 6.3 includes exactly projetos with pontos or bibliografia**
    - Gerar projetos com combinações de pontos/bibliografia/template defaults, verificar inclusão correta
    - **Validates: Requirements 5.2, 5.4**

  - [ ]* 8.4 Write property test: PDF volunteer count reflects voluntariosSolicitados (Property 7)
    - **Property 7: PDF volunteer count reflects voluntariosSolicitados**
    - Gerar projetos com valores arbitrários de voluntariosSolicitados, verificar mapeamento exato
    - **Validates: Requirements 5.5**

- [x] 9. Final checkpoint - Garantir integridade completa
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Checkpoints ensure incremental validation
- Property tests validate universal correctness properties from the design document
- Unit tests validate specific examples and edge cases
- O projeto usa Vitest + fast-check para property-based testing
- Os componentes seguem padrão existente: Radix UI + React Hook Form + Zod
- Serviço existente `selecao-service.ts` e router `selecao.ts` serão expandidos
- Template fallback já é implementado no PDF service — esta feature foca na UI e persistência

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "2.1", "2.2"] },
    { "id": 2, "tasks": ["2.3", "2.4", "2.5", "4.2"] },
    { "id": 3, "tasks": ["4.1", "5.1"] },
    { "id": 4, "tasks": ["5.2", "6.1"] },
    { "id": 5, "tasks": ["6.2", "6.3"] },
    { "id": 6, "tasks": ["6.4", "8.1"] },
    { "id": 7, "tasks": ["8.2", "8.3", "8.4"] }
  ]
}
```
