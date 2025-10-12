import { pgEnum } from 'drizzle-orm/pg-core'

// Shared enums
export const semestreEnum = pgEnum('semestre_enum', ['SEMESTRE_1', 'SEMESTRE_2'])

export const tipoProposicaoEnum = pgEnum('tipo_proposicao_enum', ['INDIVIDUAL', 'COLETIVA'])

export const tipoVagaEnum = pgEnum('tipo_vaga_enum', ['BOLSISTA', 'VOLUNTARIO'])

export const tipoEditalEnum = pgEnum('tipo_edital_enum', ['DCC', 'PROGRAD'])

export const projetoStatusEnum = pgEnum('projeto_status_enum', [
  'DRAFT', // Professor creating the project
  'SUBMITTED', // Professor submitted for admin approval
  'APPROVED', // Admin approved (professor already signed)
  'REJECTED', // Admin rejected
  'PENDING_PROFESSOR_SIGNATURE', // Waiting for professor signature (legacy)
])

export const generoEnum = pgEnum('genero_enum', ['MASCULINO', 'FEMININO', 'OUTRO', 'PREFIRO_NAO_DIZER'])

export const turnoEnum = pgEnum('turno_enum', ['MATUTINO', 'VESPERTINO', 'NOTURNO', 'EAD'])

export const modalidadeEnum = pgEnum('modalidade_enum', ['PRESENCIAL', 'EAD', 'HIBRIDO'])

export const grauAcademicoEnum = pgEnum('grau_academico_enum', ['BACHARELADO', 'LICENCIATURA', 'MESTRADO', 'DOUTORADO'])

export const regimeEnum = pgEnum('regime_enum', ['20h', '40h', 'DE'])

export const racaEnum = pgEnum('raca_enum', ['BRANCA', 'PRETA', 'PARDA', 'AMARELA', 'INDIGENA', 'NAO_DECLARADO'])
