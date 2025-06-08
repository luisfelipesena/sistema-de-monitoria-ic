import { z } from 'zod';

// Enum dos tipos de documentos obrigatórios
export const RequiredDocumentType = {
  HISTORICO_ESCOLAR: 'HISTORICO_ESCOLAR',
  COMPROVANTE_MATRICULA: 'COMPROVANTE_MATRICULA', 
  CURRICULO_LATTES: 'CURRICULO_LATTES',
  CARTA_MOTIVACAO: 'CARTA_MOTIVACAO',
  COMPROVANTE_CR: 'COMPROVANTE_CR',
  FOTO_3X4: 'FOTO_3X4',
  RG_CPF: 'RG_CPF',
} as const;

export type RequiredDocumentType = typeof RequiredDocumentType[keyof typeof RequiredDocumentType];

// Schema de validação dos tipos de documento
export const requiredDocumentTypeSchema = z.nativeEnum(RequiredDocumentType);

// Configuração de documentos obrigatórios por tipo de vaga
export const REQUIRED_DOCUMENTS_BY_TYPE = {
  BOLSISTA: [
    RequiredDocumentType.HISTORICO_ESCOLAR,
    RequiredDocumentType.COMPROVANTE_MATRICULA,
    RequiredDocumentType.COMPROVANTE_CR,
    RequiredDocumentType.RG_CPF,
    RequiredDocumentType.FOTO_3X4,
  ],
  VOLUNTARIO: [
    RequiredDocumentType.HISTORICO_ESCOLAR,
    RequiredDocumentType.COMPROVANTE_MATRICULA,
    RequiredDocumentType.COMPROVANTE_CR,
  ],
  ANY: [
    RequiredDocumentType.HISTORICO_ESCOLAR,
    RequiredDocumentType.COMPROVANTE_MATRICULA,
    RequiredDocumentType.COMPROVANTE_CR,
  ],
} as const;

// Metadados dos documentos (nomes e descrições amigáveis)
export const DOCUMENT_METADATA = {
  [RequiredDocumentType.HISTORICO_ESCOLAR]: {
    name: 'Histórico Escolar',
    description: 'Histórico escolar atualizado emitido pela UFBA',
    acceptedFormats: ['application/pdf'],
    maxSizeMB: 5,
  },
  [RequiredDocumentType.COMPROVANTE_MATRICULA]: {
    name: 'Comprovante de Matrícula',
    description: 'Comprovante de matrícula ativo no semestre atual',
    acceptedFormats: ['application/pdf'],
    maxSizeMB: 2,
  },
  [RequiredDocumentType.CURRICULO_LATTES]: {
    name: 'Currículo Lattes',
    description: 'Currículo Lattes atualizado',
    acceptedFormats: ['application/pdf'],
    maxSizeMB: 3,
  },
  [RequiredDocumentType.CARTA_MOTIVACAO]: {
    name: 'Carta de Motivação',
    description: 'Carta explicando interesse na monitoria',
    acceptedFormats: ['application/pdf'],
    maxSizeMB: 2,
  },
  [RequiredDocumentType.COMPROVANTE_CR]: {
    name: 'Comprovante de CR',
    description: 'Comprovante do coeficiente de rendimento',
    acceptedFormats: ['application/pdf'],
    maxSizeMB: 2,
  },
  [RequiredDocumentType.FOTO_3X4]: {
    name: 'Foto 3x4',
    description: 'Foto 3x4 recente e colorida',
    acceptedFormats: ['image/jpeg', 'image/png'],
    maxSizeMB: 1,
  },
  [RequiredDocumentType.RG_CPF]: {
    name: 'RG e CPF',
    description: 'Cópias do RG e CPF',
    acceptedFormats: ['application/pdf', 'image/jpeg', 'image/png'],
    maxSizeMB: 3,
  },
} as const;

// Função para obter documentos obrigatórios por tipo de vaga
export function getRequiredDocuments(tipoVaga: keyof typeof REQUIRED_DOCUMENTS_BY_TYPE): RequiredDocumentType[] {
  return [...(REQUIRED_DOCUMENTS_BY_TYPE[tipoVaga] || [])];
}

// Função para validar se todos os documentos obrigatórios foram enviados
export function validateRequiredDocuments(
  tipoVaga: keyof typeof REQUIRED_DOCUMENTS_BY_TYPE,
  uploadedDocuments: string[]
): {
  isValid: boolean;
  missingDocuments: RequiredDocumentType[];
  requiredDocuments: RequiredDocumentType[];
} {
  const requiredDocuments = getRequiredDocuments(tipoVaga);
  const missingDocuments = requiredDocuments.filter(
    doc => !uploadedDocuments.includes(doc)
  );

  return {
    isValid: missingDocuments.length === 0,
    missingDocuments,
    requiredDocuments,
  };
}

// Função para obter metadados de um documento
export function getDocumentMetadata(documentType: RequiredDocumentType) {
  return DOCUMENT_METADATA[documentType];
}

// Schema de validação para documentos de inscrição
export const inscricaoDocumentSchema = z.object({
  tipoDocumento: requiredDocumentTypeSchema,
  fileId: z.string().min(1, 'ID do arquivo é obrigatório'),
});

export const inscricaoDocumentListSchema = z.array(inscricaoDocumentSchema);

// Função para verificar completude de documentos
export function checkDocumentCompleteness(
  tipoVaga: keyof typeof REQUIRED_DOCUMENTS_BY_TYPE,
  documents: Array<{ tipoDocumento: string }>
) {
  const uploadedTypes = documents.map(doc => doc.tipoDocumento);
  return validateRequiredDocuments(tipoVaga, uploadedTypes);
}