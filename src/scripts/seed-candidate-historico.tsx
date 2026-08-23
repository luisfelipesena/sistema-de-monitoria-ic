import { db } from '@/server/db'
import { alunoTable, inscricaoDocumentoTable, inscricaoTable, userTable } from '@/server/db/schema'
import minioClient, { bucketName, ensureBucketExists } from '@/server/lib/minio'
import { logger } from '@/utils/logger'
import { Document, Page, pdf, StyleSheet, Text, View } from '@react-pdf/renderer'
import { eq } from 'drizzle-orm'
import React from 'react'

const log = logger.child({ context: 'SeedCandidateHistorico' })

const styles = StyleSheet.create({
  page: { padding: 30, fontSize: 12 },
  title: { fontSize: 18, marginBottom: 10, fontWeight: 'bold' },
  subtitle: { fontSize: 14, marginBottom: 20, color: '#555' },
  row: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#ccc', paddingVertical: 6 },
  col1: { width: '20%' },
  col2: { width: '60%' },
  col3: { width: '20%', textAlign: 'right' },
})

function SampleHistoricoPDF({ nome, matricula, cr }: { nome: string; matricula: string; cr: string }) {
  return (
    <Document>
      <Page style={styles.page}>
        <Text style={styles.title}>UNIVERSIDADE FEDERAL DA BAHIA</Text>
        <Text style={styles.subtitle}>HISTÓRICO ESCOLAR COMPLETO (Demonstração)</Text>

        <Text style={{ marginBottom: 5 }}>Aluno(a): {nome}</Text>
        <Text style={{ marginBottom: 5 }}>Matrícula: {matricula}</Text>
        <Text style={{ marginBottom: 15 }}>CR Global: {cr}</Text>

        <View style={[styles.row, { borderTopWidth: 1, backgroundColor: '#f0f0f0' }]}>
          <Text style={[styles.col1, { fontWeight: 'bold' }]}>Código</Text>
          <Text style={[styles.col2, { fontWeight: 'bold' }]}>Componente Curricular</Text>
          <Text style={[styles.col3, { fontWeight: 'bold' }]}>Nota</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.col1}>MATA37</Text>
          <Text style={styles.col2}>INTRODUÇÃO À PROGRAMAÇÃO</Text>
          <Text style={styles.col3}>9.0</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.col1}>MATA40</Text>
          <Text style={styles.col2}>ESTRUTURA DE DADOS E ALGORITMOS I</Text>
          <Text style={styles.col3}>9.5</Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.col1}>MATA55</Text>
          <Text style={styles.col2}>PROGRAMAÇÃO ORIENTADA A OBJETOS</Text>
          <Text style={styles.col3}>8.8</Text>
        </View>
      </Page>
    </Document>
  )
}

async function run() {
  log.info('🌱 Verificando/criando bucket no MinIO...')
  await ensureBucketExists(bucketName)

  const alunos = await db.select().from(alunoTable)

  log.info(`Encontrados ${alunos.length} alunos para popular histórico escolar.`)

  for (const aluno of alunos) {
    const fileId = `aluno-documents/${aluno.id}/historico_escolar.pdf`
    log.info(`Gerando PDF de histórico para aluno ${aluno.nomeCompleto} (${fileId})...`)

    const pdfStream = pdf(
      SampleHistoricoPDF({
        nome: aluno.nomeCompleto,
        matricula: aluno.matricula ?? '20241000',
        cr: aluno.cr?.toString() ?? '8.5',
      })
    )

    const blob = await pdfStream.toBlob()
    const buffer = Buffer.from(await blob.arrayBuffer())

    await minioClient.putObject(bucketName, fileId, buffer, buffer.length, {
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'inline',
    })

    await db.update(alunoTable).set({ historicoEscolarFileId: fileId }).where(eq(alunoTable.id, aluno.id))

    const inscricoes = await db.select().from(inscricaoTable).where(eq(inscricaoTable.alunoId, aluno.id))

    for (const inscricao of inscricoes) {
      const existingDoc = await db.query.inscricaoDocumentoTable.findFirst({
        where: eq(inscricaoDocumentoTable.fileId, fileId),
      })
      if (!existingDoc) {
        await db.insert(inscricaoDocumentoTable).values({
          inscricaoId: inscricao.id,
          fileId,
          tipoDocumento: 'HISTORICO_ESCOLAR',
        })
      }
    }
    log.info(`✅ Histórico para ${aluno.nomeCompleto} enviado ao MinIO e vinculado com sucesso!`)
  }
}

run()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
