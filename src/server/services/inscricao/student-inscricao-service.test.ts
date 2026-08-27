import { profileIdentityConflict } from '@/server/lib/errors'
import {
  TIPO_DOCUMENTO_INSCRICAO_COMPROVANTE_MATRICULA,
  TIPO_DOCUMENTO_INSCRICAO_CPF,
  TIPO_DOCUMENTO_INSCRICAO_HISTORICO_ESCOLAR,
  TIPO_DOCUMENTO_INSCRICAO_RG,
  inscriptionFormSchema,
} from '@/types'
import { describe, expect, it } from 'vitest'
import { getMissingRequiredDocuments, resolveInscricaoDocuments } from './student-inscricao-service'

describe('student inscription inputs', () => {
  it('accepts matrícula and two new documents when the transcript comes from the profile', () => {
    const result = inscriptionFormSchema.parse({
      projetoId: 1,
      tipoVagaPretendida: 'VOLUNTARIO',
      cursouComponente: true,
      signatureDataUrl: `data:image/png;base64,${'a'.repeat(120)}`,
      localAssinatura: 'Salvador',
      uploadedDocuments: [
        { fileId: 'rg.pdf', tipoDocumento: TIPO_DOCUMENTO_INSCRICAO_RG },
        { fileId: 'cpf.pdf', tipoDocumento: TIPO_DOCUMENTO_INSCRICAO_CPF },
      ],
      profilePatch: { matricula: '225115868', cpf: '52998224725' },
    })

    expect(result.profilePatch?.matricula).toBe('225115868')
    expect(result.profilePatch?.cpf).toBe('529.982.247-25')
    expect(result.uploadedDocuments).toHaveLength(2)
  })

  it('reuses profile documents and lets a new upload replace them', () => {
    const documents = resolveInscricaoDocuments(
      [
        { fileId: 'rg.pdf', tipoDocumento: TIPO_DOCUMENTO_INSCRICAO_RG },
        { fileId: 'cpf.pdf', tipoDocumento: TIPO_DOCUMENTO_INSCRICAO_CPF },
        { fileId: 'new-history.pdf', tipoDocumento: TIPO_DOCUMENTO_INSCRICAO_HISTORICO_ESCOLAR },
      ],
      {
        historicoEscolarFileId: 'profile-history.pdf',
        comprovanteMatriculaFileId: 'profile-enrollment.pdf',
      }
    )

    expect(documents).toEqual(
      expect.arrayContaining([
        { fileId: 'new-history.pdf', tipoDocumento: TIPO_DOCUMENTO_INSCRICAO_HISTORICO_ESCOLAR },
        {
          fileId: 'profile-enrollment.pdf',
          tipoDocumento: TIPO_DOCUMENTO_INSCRICAO_COMPROVANTE_MATRICULA,
        },
      ])
    )
    expect(getMissingRequiredDocuments(documents)).toEqual([])
  })

  it('reports the missing transcript and maps identity conflicts', () => {
    const documents = resolveInscricaoDocuments(
      [
        { fileId: 'rg.pdf', tipoDocumento: TIPO_DOCUMENTO_INSCRICAO_RG },
        { fileId: 'cpf.pdf', tipoDocumento: TIPO_DOCUMENTO_INSCRICAO_CPF },
      ],
      { historicoEscolarFileId: null, comprovanteMatriculaFileId: null }
    )

    expect(getMissingRequiredDocuments(documents)).toEqual([TIPO_DOCUMENTO_INSCRICAO_HISTORICO_ESCOLAR])
    expect(profileIdentityConflict({ code: '23505', constraint_name: 'aluno_matricula_unique' })?.code).toBe('CONFLICT')
    expect(profileIdentityConflict({ code: '23505', constraint_name: 'aluno_cpf_unique' })?.message).toBe(
      'Este CPF já está vinculado a outra conta. Recupere o acesso à conta anterior ou procure a coordenação antes de continuar.'
    )
    expect(profileIdentityConflict({ code: '23505', constraint_name: 'aluno_cpf_normalized_unique' })?.code).toBe(
      'CONFLICT'
    )
    expect(profileIdentityConflict({ code: '23505', constraint_name: 'professor_cpf_normalized_unique' })?.code).toBe(
      'CONFLICT'
    )
    expect(
      profileIdentityConflict({ code: '23505', constraint_name: 'professor_matricula_siape_normalized_unique' })
        ?.message
    ).toContain('matrícula SIAPE')
    expect(
      profileIdentityConflict({
        cause: { code: '23505', constraint_name: 'aluno_cpf_normalized_unique' },
      })?.code
    ).toBe('CONFLICT')
    expect(profileIdentityConflict({ code: '23505', constraint_name: 'other_unique' })).toBeNull()
  })
})
