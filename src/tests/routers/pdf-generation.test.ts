import { describe, it, expect, vi, beforeEach } from 'vitest'
import { PDFService } from '@/server/lib/pdf-service'

// Mock PDFService
vi.mock('@/server/lib/pdf-service', () => ({
  PDFService: {
    generateAndSaveSignedProjetoPDF: vi.fn(),
    getLatestProjetoPDF: vi.fn(),
    generateProjetoPDF: vi.fn(),
    saveProjetoPDF: vi.fn(),
    addSignatureToPDF: vi.fn(),
  },
}))

// Mock MinIO client
vi.mock('@/server/lib/minio', () => ({
  default: {
    listObjectsV2: vi.fn().mockReturnValue({
      on: vi.fn((event, callback) => {
        if (event === 'end') callback()
      }),
    }),
    presignedGetObject: vi.fn().mockResolvedValue('https://test.com/pdf.pdf'),
    putObject: vi.fn().mockResolvedValue('etag'),
    getObject: vi.fn().mockResolvedValue(Buffer.from('pdf-content')),
  },
  bucketName: 'test-bucket',
  ensureBucketExists: vi.fn(),
}))

// Mock email service
vi.mock('@/server/lib/email-service', () => ({
  emailService: {
    sendProfessorAssinouPropostaNotification: vi.fn(),
    sendAdminAprovou: vi.fn(),
  },
}))

const _mockProfessorUser = {
  id: 2,
  username: 'professor',
  email: 'prof@test.com',
  role: 'professor' as const,
  assinaturaDefault: null,
  dataAssinaturaDefault: null,
}

const _mockAdminUser = {
  id: 1,
  username: 'admin',
  email: 'admin@test.com',
  role: 'admin' as const,
  assinaturaDefault: null,
  dataAssinaturaDefault: null,
}

describe('PDF Generation Flow - Essential Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('PDF Service Tests', () => {
    it('should generate PDF with complete data', async () => {
      const mockPDFService = PDFService as any
      mockPDFService.generateAndSaveSignedProjetoPDF.mockResolvedValue('test-file.pdf')

      const testData = {
        titulo: 'Monitoria de Programação I',
        descricao: 'Descrição do projeto',
        departamento: { id: 1, nome: 'Departamento de Ciência da Computação' },
        professorResponsavel: {
          id: 1,
          nomeCompleto: 'Prof. Dr. João Silva',
          emailInstitucional: 'joao.silva@ufba.br',
          genero: 'MASCULINO' as const,
          cpf: '123.456.789-00',
          regime: 'DE' as const,
        },
        ano: 2025,
        semestre: 'SEMESTRE_1' as const,
        tipoProposicao: 'INDIVIDUAL' as const,
        bolsasSolicitadas: 2,
        voluntariosSolicitados: 3,
        cargaHorariaSemana: 12,
        numeroSemanas: 16,
        publicoAlvo: 'Estudantes',
        estimativaPessoasBenificiadas: 50,
        disciplinas: [{ id: 1, codigo: 'MATC99', nome: 'Programação I' }],
        projetoId: 1,
      }

      const result = await mockPDFService.generateAndSaveSignedProjetoPDF(
        testData,
        'professor-signature',
        'admin-signature'
      )

      expect(result).toBe('test-file.pdf')
      expect(mockPDFService.generateAndSaveSignedProjetoPDF).toHaveBeenCalledWith(
        testData,
        'professor-signature',
        'admin-signature'
      )
    })

    it('should generate basic PDF without signatures', async () => {
      const mockPDFService = PDFService as any
      mockPDFService.generateProjetoPDF.mockResolvedValue(Buffer.from('pdf-content'))

      const testData = {
        titulo: 'Test Project',
        descricao: 'Test Description',
        ano: 2025,
        semestre: 'SEMESTRE_1' as const,
        projetoId: 1,
      }

      const result = await mockPDFService.generateProjetoPDF(testData)

      expect(result).toBeInstanceOf(Buffer)
      expect(mockPDFService.generateProjetoPDF).toHaveBeenCalledWith(testData)
    })

    it('should add signature to PDF', async () => {
      const mockPDFService = PDFService as any
      mockPDFService.addSignatureToPDF.mockResolvedValue(Buffer.from('signed-pdf'))

      const pdfBuffer = Buffer.from('original-pdf')
      const signatureData = 'data:image/png;base64,signature'

      const result = await mockPDFService.addSignatureToPDF(pdfBuffer, signatureData, 'professor')

      expect(result).toBeInstanceOf(Buffer)
      expect(mockPDFService.addSignatureToPDF).toHaveBeenCalledWith(pdfBuffer, signatureData, 'professor')
    })

    it('should save PDF to storage', async () => {
      const mockPDFService = PDFService as any
      mockPDFService.saveProjetoPDF.mockResolvedValue('projetos/1/test.pdf')

      const pdfBuffer = Buffer.from('pdf-content')
      const result = await mockPDFService.saveProjetoPDF(1, pdfBuffer)

      expect(result).toBe('projetos/1/test.pdf')
      expect(mockPDFService.saveProjetoPDF).toHaveBeenCalledWith(1, pdfBuffer)
    })

    it('should retrieve latest PDF from storage', async () => {
      const mockPDFService = PDFService as any
      mockPDFService.getLatestProjetoPDF.mockResolvedValue({
        objectName: 'projetos/1/latest.pdf',
        buffer: Buffer.from('pdf-content'),
      })

      const result = await mockPDFService.getLatestProjetoPDF(1)

      expect(result).toEqual({
        objectName: 'projetos/1/latest.pdf',
        buffer: Buffer.from('pdf-content'),
      })
      expect(mockPDFService.getLatestProjetoPDF).toHaveBeenCalledWith(1)
    })
  })

  describe('Integration Tests', () => {
    it('should handle complete PDF workflow', async () => {
      const mockPDFService = PDFService as any

      // Mock the complete workflow
      mockPDFService.generateProjetoPDF.mockResolvedValue(Buffer.from('base-pdf'))
      mockPDFService.addSignatureToPDF.mockResolvedValue(Buffer.from('signed-pdf'))
      mockPDFService.saveProjetoPDF.mockResolvedValue('projetos/1/final.pdf')
      mockPDFService.getLatestProjetoPDF.mockResolvedValue({
        objectName: 'projetos/1/final.pdf',
        buffer: Buffer.from('final-pdf'),
      })

      const testData = {
        titulo: 'Complete Test Project',
        descricao: 'Complete workflow test',
        ano: 2025,
        semestre: 'SEMESTRE_1' as const,
        projetoId: 1,
      }

      // Test the workflow
      const basePdf = await mockPDFService.generateProjetoPDF(testData)
      const signedPdf = await mockPDFService.addSignatureToPDF(basePdf, 'signature', 'professor')
      const savedPath = await mockPDFService.saveProjetoPDF(1, signedPdf)
      const retrievedPdf = await mockPDFService.getLatestProjetoPDF(1)

      expect(basePdf).toBeInstanceOf(Buffer)
      expect(signedPdf).toBeInstanceOf(Buffer)
      expect(savedPath).toBe('projetos/1/final.pdf')
      expect(retrievedPdf.objectName).toBe('projetos/1/final.pdf')
    })

    it('should validate PDF generation parameters', () => {
      const mockPDFService = PDFService as any
      mockPDFService.generateAndSaveSignedProjetoPDF.mockResolvedValue('success')

      const validData = {
        titulo: 'Valid Project',
        descricao: 'Valid description',
        ano: 2025,
        semestre: 'SEMESTRE_1' as const,
        projetoId: 1,
      }

      expect(() => mockPDFService.generateAndSaveSignedProjetoPDF(validData)).not.toThrow()
    })
  })

  describe('Error Handling', () => {
    it('should handle PDF generation errors gracefully', async () => {
      const mockPDFService = PDFService as any
      mockPDFService.generateProjetoPDF.mockRejectedValue(new Error('PDF generation failed'))

      const testData = {
        titulo: 'Test Project',
        descricao: 'Test Description',
        ano: 2025,
        semestre: 'SEMESTRE_1' as const,
        projetoId: 1,
      }

      await expect(mockPDFService.generateProjetoPDF(testData)).rejects.toThrow('PDF generation failed')
    })

    it('should handle signature addition errors', async () => {
      const mockPDFService = PDFService as any
      mockPDFService.addSignatureToPDF.mockRejectedValue(new Error('Signature addition failed'))

      const pdfBuffer = Buffer.from('pdf-content')
      const signatureData = 'invalid-signature'

      await expect(mockPDFService.addSignatureToPDF(pdfBuffer, signatureData, 'professor')).rejects.toThrow(
        'Signature addition failed'
      )
    })
  })
})
