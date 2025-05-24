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

  projeto: {
    list: ['projeto', 'list'],
    byId: (id: string) => ['projeto', id],
    inscricoes: (id: number) => ['projeto', id, 'inscricoes'],
  },

  disciplina: {
    list: ['disciplina', 'list'],
    byId: (id: string) => ['disciplina', id],
  },

  // Período de inscrição related queries
  periodoInscricao: {
    list: ['periodoInscricao', 'list'],
    byId: (id: string) => ['periodoInscricao', id],
  },
};
