// Smoke test: renderiza os três templates e grava em /tmp para inspeção.
// Uso: npx tsx scripts/test-inscricao-pdfs.ts
import { renderToBuffer } from '@react-pdf/renderer'
import { writeFileSync } from 'node:fs'
import React from 'react'
import { AnexoITermoCompromissoMonitorTemplate } from '../src/server/lib/pdfTemplates/anexo-i-termo-compromisso-monitor'
import { AnexoIIIInscricaoBolsistaTemplate } from '../src/server/lib/pdfTemplates/anexo-iii-inscricao-bolsista'
import { AnexoIVInscricaoVoluntarioTemplate } from '../src/server/lib/pdfTemplates/anexo-iv-inscricao-voluntario'
import type { AnexoIIIInputs, AnexoITermoInputs, AnexoIVInputs } from '../src/types/inscricao-pdf-inputs'

const monitor: AnexoIVInputs['monitor'] = {
  nomeCompleto: 'Liz Oliveira Souza Rabaçal',
  nomeSocial: null,
  cpf: '04651640567',
  rg: '2143961502',
  matricula: '223116359',
  dataNascimento: new Date('2005-05-18'),
  genero: 'FEMININO',
  endereco: {
    rua: 'Rua Amazonas',
    numero: 126,
    bairro: 'Centro',
    cidade: 'Candeias',
    estado: 'Bahia',
    cep: '43805-080',
    complemento: null,
  },
  telefone: '71992075679',
  telefoneFixo: null,
  email: 'lizrabacala@gmail.com',
  cursoNome: 'Sistemas de Informação',
  cr: 8.5,
  banco: null,
  agencia: null,
  conta: null,
  digitoConta: null,
}

const projeto: AnexoIVInputs['projeto'] = {
  unidadeUniversitaria: 'Instituto de Computação',
  departamentoNome: 'Departamento de Ciência da Computação',
  disciplina: { codigo: 'MATA37', nome: 'Introdução à Lógica de Programação' },
  professorResponsavelNome: 'Rubisley de Paula Lemes',
  professorOrientadorNome: 'Rubisley de Paula Lemes',
  ano: 2025,
  semestre: 'SEMESTRE_1',
  periodoInicio: new Date('2025-03-24'),
  periodoFim: new Date('2025-07-26'),
}

async function main() {
  const ivInputs: AnexoIVInputs = {
    monitor,
    projeto,
    declaracao: { cursouComponente: true, disciplinaEquivalente: null },
    signature: null,
  }
  const iv = await renderToBuffer(React.createElement(AnexoIVInscricaoVoluntarioTemplate, { data: ivInputs }))
  writeFileSync('/tmp/test-anexo-iv.pdf', iv)
  console.log('✓ Anexo IV:', iv.length, 'bytes -> /tmp/test-anexo-iv.pdf')

  const iiiInputs: AnexoIIIInputs = {
    monitor: { ...monitor, banco: 'Banco do Brasil', agencia: '1234-5', conta: '98765', digitoConta: '0' },
    projeto,
    declaracao: { cursouComponente: true, disciplinaEquivalente: null },
    signature: null,
  }
  const iii = await renderToBuffer(React.createElement(AnexoIIIInscricaoBolsistaTemplate, { data: iiiInputs }))
  writeFileSync('/tmp/test-anexo-iii.pdf', iii)
  console.log('✓ Anexo III:', iii.length, 'bytes -> /tmp/test-anexo-iii.pdf')

  const termoInputs: AnexoITermoInputs = {
    monitor,
    projeto,
    tipoVaga: 'VOLUNTARIO',
    signature: null,
  }
  const i = await renderToBuffer(React.createElement(AnexoITermoCompromissoMonitorTemplate, { data: termoInputs }))
  writeFileSync('/tmp/test-anexo-i.pdf', i)
  console.log('✓ Anexo I (Termo):', i.length, 'bytes -> /tmp/test-anexo-i.pdf')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
