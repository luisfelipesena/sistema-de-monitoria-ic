Relatório de Conformidade – Sistema de Monitoria IC
Base: Anotações de Testes (v11_07) e Avaliação do Roteiro de Demonstração

1. Introdução
O presente relatório apresenta uma análise crítica da conformidade entre a implementação atual do sistema de monitoria de iniciação científica (IC) e os requisitos funcionais/testes definidos nos documentos “Anotações de Testes - Entrega final - v11_07” e “Avaliação do roteiro de demonstração do sistema de monitoria IC”.
O objetivo foi identificar não apenas se as funções existem, mas se estão maduras para uso institucional — destacando casos em que a experiência do usuário e a integridade dos dados podem ser comprometidas.
2. Metodologia
Avaliamos o sistema com base em:
- Testes manuais: Simulação de fluxos reais de admin, professor e aluno (incluindo tentativas de erro proposital).
- Revisão de código: Verificação dos pontos críticos (validações, rotinas de exclusão, assinatura, uploads, SQL).
- Análise das rotas e interfaces: Buscando inconsistências visuais e falhas de feedback ao usuário.
- Comparação linha a linha com as observações dos documentos de testes.

Durante os testes, foi priorizado situações-limite (ex.: tentativas de submeter formulários incompletos, manipulação de arquivos de tamanho excedente e fluxos interrompidos no meio do onboarding).
3. Análise de Conformidade por Fluxo
3.1. Fluxo do Administrador
Pontos críticos observados:
- Assinatura de Documentos:
  Observamos que o sistema permite aprovar projetos sem a assinatura do administrador. Em três testes consecutivos, a aprovação sem assinatura fez o projeto desaparecer da aba de assinaturas, sem possibilidade de correção. Tivemos que restaurar o banco manualmente — em produção, seria um cenário de alto risco para integridade institucional.
- Planilha PROGRAD:
  O botão “Planilha PROGRAD” executa a chamada na API, mas o download não inicia automaticamente no navegador. Isso gera incerteza para o usuário, como “enviar um e-mail sem receber confirmação de entrega”.
  Sugestão: O botão deve disparar o download imediatamente ou exibir uma mensagem de erro (“Nenhum dado disponível para download”).
- Publicação de Editais:
  É possível publicar edital vazio, o que pode comprometer a formalidade do processo seletivo.
- Templates de Projeto:
  Notamos um padrão de inconsistência: a tabela exibe as atividades, mas não há opção para adicionar/editar essas atividades ao criar ou alterar o template. Isso pode levar ao uso de templates “fantasmas”, sem conteúdo real.
- Importação de Planejamentos:
  Ao importar planilhas com formato incorreto, a interface fica eternamente em “Processando”. A falta de timeout ou feedback é um problema recorrente; em experiência real, tivemos que reiniciar o sistema para liberar a fila de processamento.

Detalhes:
Verificacao do perfil do prof com a falta de feedback visual ao aplicar filtros ou executar ações como download e exclusão — principalmente quando o botão fica habilitado mas não executa nada perceptível.
3.2. Fluxo do Professor
Pontos críticos:
- Onboarding e Cadastro:
  Mensagens de campo obrigatório só aparecem para campos de texto. Dropdowns impedem o submit, mas não há nenhuma indicação do motivo — o que levou vários professores a tentarem repetidamente preencher o formulário sem sucesso, como relatado em reuniões.
  SIAPE e CPF aceitam qualquer valor (inclusive letras), e o erro só aparece após tentativa de envio, em formato pouco amigável (HTTP 400).
  Se o onboarding for interrompido (por exemplo, um reload acidental), as opções de configuração somem, obrigando a apagar o registro e começar de novo.
- Projetos:
  O sistema permite vincular múltiplas disciplinas a um único projeto, indo contra o item 2.8 do edital (“um projeto = uma disciplina”). Em simulação, isso levou à geração de planilhas inconsistentes e rejeição automática pelo sistema da Prograd.
  O preview do PDF trava a tela com frequência. Em uma demonstração real, um professor relatou que perdeu todos os dados digitados ao tentar alterar um campo enquanto o preview era gerado em tempo real.
  Não é possível selecionar templates criados pelo admin — criando um cenário onde a governança da padronização é apenas teórica.
- Processo Seletivo e Resultados:
  Publicar resultados e gerar atas pode falhar silenciosamente, sem mensagem de erro. A ausência de seleção padrão faz com que, ao tentar publicar sem projeto selecionado, o sistema tente operar sobre “null”, gerando exceções internas.
  Exemplo: “Na prática, publicar resultado sem seleção gera falha silenciosa — algo que pode atrasar o cronograma institucional.”
- Gestão Acadêmica:
  Detectado um erro SQL 500 sempre que tento recuperar disciplinas de um professor vinculado a múltiplas disciplinas (“invalid input syntax for type integer: '14,13'”).
  Este tipo de bug compromete o fluxo de quem leciona várias matérias, perfil comum em IC.

Detalhes:
Em simulações de teste, no perfil professor há travamento do preview de PDF e de não conseguir editar projetos já criados como rascunho — sendo obrigado a descartar o trabalho já feito.
3.3. Fluxo do Aluno
Pontos críticos:
- Onboarding:
  Matrícula e CPF aceitam caracteres não numéricos. RG, apesar de essencial para processos oficiais, não é obrigatório.
  Mensagens de “campo obrigatório” só aparecem para texto, nunca para dropdowns ou uploads, gerando frustração.
- Inscrição em Monitoria:
  Identificado, em todos os testes, que tentar se inscrever resulta em erro HTTP 400, sem mensagem visível ao aluno.
  Analogamente, é como se um aluno “batesse na porta” e ninguém informasse se foi aceito ou recusado.
  Também é possível se inscrever em categorias sem vagas disponíveis.
- Dashboard:
  Falta indicação de filtros aplicados e, com projetos aprovados, ocorre erro ao clicar em “Ver Vagas Disponíveis”.
- Perfil:
  Inconsistência entre onboarding (histórico escolar opcional) e perfil (histórico obrigatório).


3.4. Relatórios, Analytics e Módulos Específicos
- Relatórios e Analytics: Funcionam conforme esperado, com geração correta de estatísticas e exportação.
- Módulo 1 (Projetos) e Módulo 4 (Relatórios/Analytics): Sem anomalias relevantes.
- Módulo 2 e 3 (Editais, Seleção, Resultados): Necessitam de melhorias, especialmente em ordenação, edição de rascunhos e preview de projetos.
4. Conclusão e Recomendações Prioritárias
O sistema, apesar de estruturalmente alinhado com os fluxos institucionais, apresenta vulnerabilidades críticas nos pontos de validação, feedback visual e integridade do fluxo de aprovação/assinatura.
Observado que pequenos descuidos de UX (experiência do usuário) podem resultar em perdas de dados, frustração e retrabalho, especialmente em períodos de pico (inscrições, publicação de resultados).
Recomendações por ordem de impacto:
1. Impedir aprovação/publicação sem assinatura obrigatória — risco alto de perda de rastreabilidade institucional.
2. Validações front e backend em todos os formulários (incluindo dropdowns e campos numéricos) — reduz drasticamente erros silenciosos e perda de produtividade.
3. Feedback visual imediato em todas as operações críticas — exemplo: mensagens claras ao usuário quando operações falham ou aguardam processamento.
4. Restringir criação de projetos a uma única disciplina por vez — ajustar lógica e interface conforme o edital.
5. Correção do preview de PDFs e estabilidade nos formulários longos — garantir que alterações não causem congelamento ou perda de dados.
6. Padronizar pop-ups, modais de exclusão e avisos — uniformidade na comunicação de risco e ações irreversíveis.
7. Tratar e informar erros de banco (SQL 500) de maneira transparente — ao tentar recuperar disciplinas múltiplas, exibir mensagem amigável e registrar o erro para análise.
8. Ajustar lógica de inscrição de alunos, impedindo inscrição em projetos sem vagas — e garantir sempre uma mensagem contextual ao usuário.
