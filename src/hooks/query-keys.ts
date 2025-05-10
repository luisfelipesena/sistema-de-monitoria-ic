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
}; 