import React from "react"
import { Document, Font, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer"
import { PROGRAD_LOGO_BASE64, UFBA_LOGO__FORM_BASE64 } from "@/utils/images"
import { formatDateFullBR } from "./anexo-shared-styles"

if (typeof Font?.registerHyphenationCallback === "function") {
  Font.registerHyphenationCallback((word) => [word])
}

const styles = StyleSheet.create({
  page: {
    paddingTop: 30,
    paddingBottom: 35,
    paddingHorizontal: 40,
    fontSize: 9.5,
    fontFamily: "Helvetica",
    backgroundColor: "#FFFFFF",
    lineHeight: 1.3,
    color: "#000000",
  },
  headerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
    width: "100%",
  },
  ufbaLogoContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
  },
  progradLogoContainer: {
    flex: 1,
    flexDirection: "row",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  ufbaLogo: {
    width: 75,
    height: 50,
    objectFit: "contain",
  },
  divider: {
    borderRightWidth: 1,
    borderRightColor: "#888888",
    height: 40,
    marginHorizontal: 15,
  },
  progradLogo: {
    width: 140,
    height: 45,
    objectFit: "contain",
  },
  anexoSmall: {
    fontSize: 10.5,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    marginBottom: 2,
  },
  titleBig: {
    fontSize: 12.5,
    fontFamily: "Helvetica-Bold",
    textAlign: "center",
    marginBottom: 14,
    textTransform: "uppercase",
  },
  bodyParagraph: {
    marginTop: 8,
    fontSize: 9.5,
    textAlign: "justify",
    lineHeight: 1.45,
  },
  listItem: {
    marginTop: 6,
    fontSize: 9.5,
    textAlign: "justify",
    lineHeight: 1.4,
  },
  declaracao: {
    marginTop: 10,
    fontSize: 9.5,
    textAlign: "justify",
    lineHeight: 1.4,
  },
  tableContainer: {
    marginTop: 14,
    width: "100%",
  },
  tableHeader: {
    backgroundColor: "#D1D5DB",
    borderStyle: "solid",
    borderColor: "#000000",
    borderWidth: 1,
    paddingVertical: 3,
    paddingHorizontal: 5,
    textAlign: "center",
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
  },
  bankTable: {
    borderStyle: "solid",
    borderColor: "#000000",
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderBottomWidth: 0,
  },
  bankRow: {
    flexDirection: "row",
    borderStyle: "solid",
    borderColor: "#000000",
    borderBottomWidth: 1,
  },
  bankLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8.5,
    paddingVertical: 3,
    paddingHorizontal: 4,
    borderStyle: "solid",
    borderColor: "#000000",
    borderRightWidth: 1,
  },
  bankValue: {
    fontSize: 8.5,
    paddingVertical: 3,
    paddingHorizontal: 4,
    borderStyle: "solid",
    borderColor: "#000000",
    borderRightWidth: 1,
  },
  bankValueLast: {
    fontSize: 8.5,
    paddingVertical: 3,
    paddingHorizontal: 4,
  },
  smallNote: {
    fontSize: 8,
    fontFamily: "Helvetica-Bold",
    marginTop: 3,
  },
  footerSignatures: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
    marginTop: 35,
    width: "100%",
  },
  footerCellLocal: {
    width: "28%",
    textAlign: "center",
  },
  footerCellData: {
    width: "28%",
    textAlign: "center",
  },
  footerCellSignature: {
    width: "38%",
    textAlign: "center",
    position: "relative",
  },
  lineText: {
    borderBottomWidth: 1,
    borderBottomColor: "#000000",
    paddingBottom: 2,
    fontSize: 9,
    textAlign: "center",
  },
  captionText: {
    fontSize: 8.5,
    marginTop: 3,
    textAlign: "center",
  },
  signatureImg: {
    position: "absolute",
    top: -22,
    left: 10,
    width: 140,
    height: 35,
    objectFit: "contain",
  },
})

export interface TermoCompromissoProps {
  vaga: {
    id: string
    tipoBolsa: "bolsista" | "voluntario"
    dataInicio: Date
    aluno: {
      user: {
        name: string
        email: string
      }
      matricula?: string
      rg?: string
      cpf?: string
      cursoNome?: string
      banco?: string
      agencia?: string
      conta?: string
      digitoConta?: string
      telefone?: string
      endereco?: {
        rua?: string
        numero?: number
        bairro?: string
        cidade?: string
        estado?: string
        cep?: string
      }
    }
    projeto: {
      disciplina: {
        nome: string
        codigo?: string
        departamento: {
          nome: string
          sigla: string
        }
      }
      professor: {
        user: {
          name: string
          email: string
        }
        siape?: string
      }
    }
    semestre: {
      ano: number
      numero: number
    }
  }
  dataGeracao: Date
  alunoAssinaturaBase64?: string
  professorAssinaturaBase64?: string
}

export function TermoCompromissoTemplate({
  vaga,
  dataGeracao,
  alunoAssinaturaBase64,
}: TermoCompromissoProps) {
  const isBolsista = vaga.tipoBolsa === "bolsista"
  const tipoText = isBolsista ? "bolsista" : "voluntário"
  const semestreTexto = `${vaga.semestre.ano}.${vaga.semestre.numero}`

  const enderecoCompleto = vaga.aluno.endereco
    ? [
        vaga.aluno.endereco.rua,
        vaga.aluno.endereco.numero ? String(vaga.aluno.endereco.numero) : "",
        vaga.aluno.endereco.bairro,
        vaga.aluno.endereco.cidade,
        vaga.aluno.endereco.estado,
        vaga.aluno.endereco.cep ? `CEP: ${vaga.aluno.endereco.cep}` : "",
      ]
        .filter(Boolean)
        .join(", ")
    : ""

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header com Logos Perfeitamente Centralizados */}
        <View style={styles.headerRow}>
          <View style={styles.ufbaLogoContainer}>
            <Image src={UFBA_LOGO__FORM_BASE64} style={styles.ufbaLogo} cache={false} />
          </View>
          <View style={styles.divider} />
          <View style={styles.progradLogoContainer}>
            <Image src={PROGRAD_LOGO_BASE64} style={styles.progradLogo} cache={false} />
          </View>
        </View>

        {/* Títulos */}
        <Text style={styles.anexoSmall}>Anexo I</Text>
        <Text style={styles.titleBig}>TERMO DE COMPROMISSO DO MONITOR</Text>

        {/* Parágrafo do Termo de Compromisso */}
        <Text style={styles.bodyParagraph}>
          Eu, {vaga.aluno.user.name}............................................................., portador(a) do RG nº{" "}
          {vaga.aluno.rg || "—"}......................... e do CPF nº {vaga.aluno.cpf || "—"}..........................., regularmente matriculado(a) na UFBA no curso de graduação em{" "}
          {vaga.aluno.cursoNome || "Ciência da Computação"}..........................................., sob o nº de matrícula{" "}
          {vaga.aluno.matricula || "—"}......................., devidamente selecionado(a) para atuar como monitor(a){" "}
          <Text style={{ fontStyle: "italic" }}>(bolsista ou voluntário)</Text> {tipoText}.................... no projeto vinculado ao componente curricular{" "}
          <Text style={{ fontStyle: "italic" }}>(código e nome)</Text> {vaga.projeto.disciplina.codigo} - {vaga.projeto.disciplina.nome}.........................................................., a ser desenvolvido durante o semestre{" "}
          <Text style={{ fontFamily: "Helvetica-Bold" }}>{semestreTexto}</Text>, sob a responsabilidade do(a) professor(a){" "}
          {vaga.projeto.professor.user.name}..................................................., comprometo-me a:
        </Text>

        {/* Itens de Compromisso */}
        <Text style={styles.listItem}>
          1. Conhecer e respeitar as normas relativas às atividades de monitoria (Resolução CAE nº 05/2021 e edital correspondente), disponíveis na página do programa no <Text style={{ fontStyle: "italic" }}>sítio eletrônico</Text> da PROGRAD.
        </Text>
        <Text style={styles.listItem}>
          2. Cumprir as atividades propostas no projeto de monitoria indicado neste termo, assim como a carga horária de <Text style={{ fontFamily: "Helvetica-Bold" }}>12 horas semanais</Text>.
        </Text>
        <Text style={styles.listItem}>
          3. Interagir com professores e estudantes, visando apoiar os discentes matriculados no componente curricular de modo a potencializar o processo de ensino-aprendizagem.
        </Text>
        <Text style={styles.listItem}>
          4. Apresentar ao professor orientador o relatório final das atividades.
        </Text>

        {/* Declarações */}
        <Text style={styles.declaracao}>
          Declaro <Text style={{ fontFamily: "Helvetica-Bold" }}>ter cursado, com aprovação</Text>, ou <Text style={{ fontFamily: "Helvetica-Bold" }}>ter obtido dispensa</Text> do componente curricular ou equivalente ao qual se vincula o projeto.
        </Text>

        <Text style={styles.declaracao}>
          Declaro <Text style={{ fontFamily: "Helvetica-Bold" }}>não possuir nenhum tipo de bolsa na presente data</Text>, estando ciente da vedação quanto à acumulação de bolsa de monitoria com outras modalidades de bolsas oferecidas pela UFBA ou por órgãos externos, exceto quando se tratar de bolsa auxílio de permanência.
        </Text>

        <Text style={styles.declaracao}>
          Estou ciente que a inobservância dos termos acima implicará o desligamento do programa, o indeferimento da certificação e a devolução de valores recebidos indevidamente, se for o caso.
        </Text>

        {/* Tabela de Informações adicionais */}
        <View style={styles.tableContainer}>
          <Text style={styles.tableHeader}>
            Informações adicionais para recebimento da bolsa (apenas bolsistas)
          </Text>
          <View style={styles.bankTable}>
            {/* Linha 1 */}
            <View style={styles.bankRow}>
              <View style={[styles.bankLabel, { width: "15%" }]}>
                <Text>Banco*</Text>
              </View>
              <View style={[styles.bankValue, { width: "23%" }]}>
                <Text>{isBolsista ? (vaga.aluno.banco ?? "") : ""}</Text>
              </View>
              <View style={[styles.bankLabel, { width: "20%" }]}>
                <Text>Agência e dígito</Text>
              </View>
              <View style={[styles.bankValue, { width: "15%" }]}>
                <Text>{isBolsista ? (vaga.aluno.agencia ?? "") : ""}</Text>
              </View>
              <View style={[styles.bankLabel, { width: "17%" }]}>
                <Text>Conta e dígito**</Text>
              </View>
              <View style={[styles.bankValueLast, { width: "10%" }]}>
                <Text>
                  {isBolsista
                    ? `${vaga.aluno.conta ?? ""}${vaga.aluno.digitoConta ? `-${vaga.aluno.digitoConta}` : ""}`
                    : ""}
                </Text>
              </View>
            </View>

            {/* Linha 2 */}
            <View style={styles.bankRow}>
              <View style={[styles.bankLabel, { width: "15%" }]}>
                <Text>Endereço e CEP</Text>
              </View>
              <View style={[styles.bankValueLast, { width: "85%" }]}>
                <Text>{isBolsista ? enderecoCompleto : ""}</Text>
              </View>
            </View>

            {/* Linha 3 */}
            <View style={styles.bankRow}>
              <View style={[styles.bankLabel, { width: "15%" }]}>
                <Text>Celular com DDD</Text>
              </View>
              <View style={[styles.bankValue, { width: "35%" }]}>
                <Text>{isBolsista ? (vaga.aluno.telefone ?? "") : ""}</Text>
              </View>
              <View style={[styles.bankLabel, { width: "12%" }]}>
                <Text>E-mail</Text>
              </View>
              <View style={[styles.bankValueLast, { width: "38%" }]}>
                <Text style={{ color: isBolsista ? "#0000EE" : "#000000" }}>
                  {isBolsista ? vaga.aluno.user.email : ""}
                </Text>
              </View>
            </View>
          </View>

          <Text style={styles.smallNote}>* exceto Mercado Pago</Text>
          <Text style={styles.smallNote}>** não pode ser conta poupança</Text>
        </View>

        {/* Rodapé com Local, Data e Assinatura */}
        <View style={styles.footerSignatures}>
          <View style={styles.footerCellLocal}>
            <Text style={styles.lineText}>Salvador</Text>
            <Text style={styles.captionText}>Local</Text>
          </View>
          <View style={styles.footerCellData}>
            <Text style={styles.lineText}>{formatDateFullBR(dataGeracao)}</Text>
            <Text style={styles.captionText}>Data</Text>
          </View>
          <View style={styles.footerCellSignature}>
            {alunoAssinaturaBase64 ? (
              <Image src={alunoAssinaturaBase64} style={styles.signatureImg} cache={false} />
            ) : null}
            <Text style={styles.lineText}> </Text>
            <Text style={styles.captionText}>Assinatura do(a) monitor(a)</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}