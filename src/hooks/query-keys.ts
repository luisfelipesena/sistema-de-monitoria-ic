/**
 * Centralized query keys for React Query
 * These keys are used by useQuery and useMutation to handle caching and refetching
 */

export const QueryKeys = {
  // Auth related queries
  auth: {
    me: ['auth', 'me'],
  },

  // User related queries
  user: {
    all: ['users'],
    byId: (id: string) => ['users', id],
    admin: {
      list: ['users', 'admin', 'list'],
    },
  },

  // Aluno related queries
  aluno: {
    all: ['aluno'],
    byId: (id: string) => ['aluno', id],
  },

  // Professor related queries
  professor: {
    all: ['professor'],
    list: ['professor', 'list'],
    byId: (id: string) => ['professor', id],
  },

  // Onboarding related queries
  onboarding: {
    status: ['onboarding', 'status'],
  },

  // Files related queries
  files: {
    all: ['files'],
    byId: (id: string) => ['files', id],
    access: (id: string) => ['files', 'access', id],
    uploads: ['files', 'uploads'],
    admin: {
      list: ['files', 'admin', 'list'],
      presignedUrls: ['files', 'admin', 'presignedUrls'],
    },
  },

  // Curso related queries
  curso: {
    all: ['curso'],
    byId: (id: string) => ['curso', id],
    admin: {
      list: ['curso', 'admin', 'list'],
    },
  },

  // Departamento related queries
  departamento: {
    list: ['departamento', 'list'],
  },

  monitoria: {
    vagas: ['monitoria', 'vagas'],
    inscricoes: ['monitoria', 'inscricoes'],
    inscricao: (id: string) => ['monitoria', 'inscricao', id],
  },

  // Vaga related queries
  vaga: {
    byId: (id: number) => ['vaga', id],
    termoCompromisso: (id: number) => ['vaga', id, 'termo-compromisso'],
  },

  projeto: {
    all: ['projeto'],
    list: ['projeto', 'list'],
    byId: (id: string) => ['projeto', id],
    detail: (id: string) => ['projeto', 'detail', id],
    inscricoes: (id: number) => ['projeto', id, 'inscricoes'],
    documents: (id: number) => ['projeto', id, 'documents'],
    selectionProcess: (id: number) => ['projeto', id, 'selection-process'],
    selectionStatus: (id: number) => ['projeto', id, 'selection-status'],
    pdf: (id: number) => ['projeto', id, 'pdf'],
    ata: (id: number) => ['projeto', id, 'ata'],
    notifyResults: (id: number) => ['projeto', id, 'notify-results'],
  },

  disciplina: {
    all: ['disciplina'],
    list: ['disciplina', 'list'],
    byId: (id: string) => ['disciplina', id],
    professor: (disciplinaId: number) => [
      'disciplina',
      disciplinaId,
      'professor',
    ],
  },

  // Período de inscrição related queries
  periodoInscricao: {
    list: ['periodoInscricao', 'list'],
    byId: (id: string) => ['periodoInscricao', id],
  },

  // Analytics related queries
  analytics: {
    dashboard: ['analytics', 'dashboard'],
  },

  // User documents related queries
  userDocuments: {
    list: ['userDocuments', 'list'],
    byType: (type: string) => ['userDocuments', type],
  },

  // Relatórios related queries
  relatorios: {
    planilhaPrograd: ['relatorios', 'planilha-prograd'],
  },

  // Notificações related queries
  notificacoes: {
    manual: ['notificacoes', 'manual'],
    historico: ['notificacoes', 'historico'],
  },

  // Import history related queries
  importHistory: {
    list: ['importHistory', 'list'],
  },

  // Novas chaves para Edital
  edital: {
    list: ['edital', 'list'],
    detail: (id: number) => ['edital', 'detail', id],
  },
};

export const QUERY_KEYS = QueryKeys;
