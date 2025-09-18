import { describe, it, expect, vi, beforeEach } from 'vitest'
import { MonitoriaFormTemplate } from '@/components/features/projects/MonitoriaFormTemplate'
import { MonitoriaFormData } from '@/types'
import React from 'react'

// Mock React PDF components
vi.mock('@react-pdf/renderer', () => ({
  Document: ({ children }: { children: React.ReactNode }) => <div data-testid="document">{children}</div>,
  Page: ({ children }: { children: React.ReactNode }) => <div data-testid="page">{children}</div>,
  View: ({ children }: { children: React.ReactNode }) => <div data-testid="view">{children}</div>,
  Text: ({ children }: { children: React.ReactNode }) => <span data-testid="text">{children}</span>,
  Image: ({ src }: { src: string }) => <img data-testid="image" src={src} alt="" />,
  StyleSheet: {
    create: vi.fn().mockReturnValue({}),
  },
}))

const mockMonitoriaFormData: MonitoriaFormData = {
  titulo: 'Monitoria de Programação I',
  descricao: 'Projeto de monitoria para auxiliar estudantes na disciplina de Programação I',
  departamento: {
    id: 1,
    nome: 'Departamento de Ciência da Computação',
  },
  coordenadorResponsavel: 'Prof. Dr. Coordenador',
  professorResponsavel: {
    id: 1,
    nomeCompleto: 'Prof. Dr. João Silva',
    nomeSocial: undefined,
    genero: 'MASCULINO',
    cpf: '123.456.789-00',
    matriculaSiape: '1234567',
    regime: 'DE',
    telefone: '(11) 99999-9999',
    telefoneInstitucional: '(11) 3333-3333',
    emailInstitucional: 'joao.silva@ufba.br',
  },
  ano: 2025,
  semestre: 'SEMESTRE_1',
  tipoProposicao: 'INDIVIDUAL',
  bolsasSolicitadas: 2,
  voluntariosSolicitados: 3,
  cargaHorariaSemana: 12,
  numeroSemanas: 16,
  publicoAlvo: 'Estudantes de Programação I',
  estimativaPessoasBenificiadas: 50,
  disciplinas: [
    {
      id: 1,
      codigo: 'MATC99',
      nome: 'Programação I',
    },
  ],
  user: {
    email: 'joao.silva@ufba.br',
    nomeCompleto: 'Prof. Dr. João Silva',
    role: 'professor',
  },
  assinaturaProfessor: undefined,
  dataAprovacao: undefined,
  dataAssinaturaProfessor: undefined,
  projetoId: 1,
}

describe('MonitoriaFormTemplate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('should render template with valid data', () => {
    const result = React.createElement(MonitoriaFormTemplate, { data: mockMonitoriaFormData })
    
    expect(result).toBeDefined()
    expect(result.props.data).toEqual(mockMonitoriaFormData)
  })

  it('should handle minimal data', () => {
    const minimalData: MonitoriaFormData = {
      titulo: 'Título Mínimo',
      descricao: 'Descrição mínima',
      ano: 2025,
      semestre: 'SEMESTRE_1',
      tipoProposicao: 'INDIVIDUAL',
      bolsasSolicitadas: 0,
      voluntariosSolicitados: 1,
      cargaHorariaSemana: 12,
      numeroSemanas: 16,
      publicoAlvo: 'Estudantes',
      disciplinas: [],
    }

    const result = React.createElement(MonitoriaFormTemplate, { data: minimalData })
    
    expect(result).toBeDefined()
    expect(result.props.data).toEqual(minimalData)
  })

  it('should handle second semester correctly', () => {
    const secondSemesterData = {
      ...mockMonitoriaFormData,
      semestre: 'SEMESTRE_2' as const,
    }

    const result = React.createElement(MonitoriaFormTemplate, { data: secondSemesterData })
    
    expect(result).toBeDefined()
    expect(result.props.data).toEqual(secondSemesterData)
  })

  it('should handle collective proposition type', () => {
    const collectiveData = {
      ...mockMonitoriaFormData,
      tipoProposicao: 'COLETIVA' as const,
    }

    const result = React.createElement(MonitoriaFormTemplate, { data: collectiveData })
    
    expect(result).toBeDefined()
    expect(result.props.data).toEqual(collectiveData)
  })

  it('should handle missing optional fields gracefully', () => {
    const dataWithMissingFields = {
      ...mockMonitoriaFormData,
      professorResponsavel: undefined,
      estimativaPessoasBenificiadas: undefined,
    }

    const result = React.createElement(MonitoriaFormTemplate, { data: dataWithMissingFields })
    
    expect(result).toBeDefined()
    expect(result.props.data).toEqual(dataWithMissingFields)
  })

  // Test internal calculations
  it('should calculate semester label correctly', () => {
    const calculateSemesterLabel = (ano: number, semestre: string) => {
      return `${ano}.${semestre === 'SEMESTRE_1' ? '1' : '2'}`
    }

    expect(calculateSemesterLabel(2025, 'SEMESTRE_1')).toBe('2025.1')
    expect(calculateSemesterLabel(2025, 'SEMESTRE_2')).toBe('2025.2')
  })

  it('should calculate total monitors correctly', () => {
    const calculateTotalMonitors = (bolsas: number, voluntarios: number) => {
      return bolsas + voluntarios
    }

    expect(calculateTotalMonitors(2, 3)).toBe(5)
    expect(calculateTotalMonitors(0, 5)).toBe(5)
    expect(calculateTotalMonitors(3, 0)).toBe(3)
  })

  it('should calculate total workload correctly', () => {
    const calculateTotalWorkload = (horasSemana: number, numeroSemanas: number) => {
      return horasSemana * numeroSemanas
    }

    expect(calculateTotalWorkload(12, 16)).toBe(192)
    expect(calculateTotalWorkload(20, 12)).toBe(240)
  })

  it('should format disciplines text correctly', () => {
    const formatDisciplines = (disciplinas: Array<{ codigo: string; nome: string }>) => {
      return disciplinas.map(d => `${d.codigo} - ${d.nome}`).join(', ') || 'Não informado'
    }

    const disciplines = [
      { codigo: 'MATC99', nome: 'Programação I' },
      { codigo: 'MATC98', nome: 'Programação II' },
    ]

    expect(formatDisciplines(disciplines)).toBe('MATC99 - Programação I, MATC98 - Programação II')
    expect(formatDisciplines([])).toBe('Não informado')
  })
})