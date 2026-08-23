import React from "react"
import { getSemestreNumero, TermoCompromissoData, TIPO_VAGA_BOLSISTA, type Semestre } from "@/types"
import { PROGRAD_LOGO_BASE64, UFBA_LOGO__FORM_BASE64 } from "@/utils/images"
import { Document, Font, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer"
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

export default function TermoCompromisso({ data }: { data: TermoCompromissoData }) {
  const { monitor, professor, projeto, monitoria, termo } = data
  const isBolsista = monitoria.tipo === TIPO_VAGA_BOLSISTA
  const tipoText = isBolsista ? "bolsista" : "voluntário"
  const semestreNum = getSemestreNumero(projeto.semestre as Semestre)

  const disciplina = projeto.disciplinas?.[0]
  const disciplinaStr = disciplina ? `${disciplina.codigo} - ${disciplina.nome}` : projeto.titulo

  const rawDate = termo?.dataGeracao ? new Date(termo.dataGeracao) : new Date()
  const dataGeracaoDate = isNaN(rawDate.getTime()) ? new Date() : rawDate

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

        {/* Parágrafo do Termo de Compromisso com pontilhados como no modelo oficial */}
        <Text style={styles.bodyParagraph}>
          Eu, {monitor.nome}............................................................., portador(a) do RG nº{" "}
          {monitor.rg || "—"}......................... e do CPF nº {monitor.cpf || "—"}..........................., regularmente matriculado(a) na UFBA no curso de graduação em{" "}
          {monitor.cursoNome || "Ciência da Computação"}..........................................., sob o nº de matrícula{" "}
          {monitor.matricula}......................., devidamente selecionado(a) para atuar como monitor(a){" "}
          <Text style={{ fontStyle: "italic" }}>(bolsista ou voluntário)</Text> {tipoText}.................... no projeto vinculado ao componente curricular{" "}
          <Text style={{ fontStyle: "italic" }}>(código e nome)</Text> {disciplinaStr}.........................................................., a ser desenvolvido durante o semestre{" "}
          <Text style={{ fontFamily: "Helvetica-Bold" }}>{projeto.ano}.{semestreNum}</Text>, sob a responsabilidade do(a) professor(a){" "}
          {professor.nome}..................................................., comprometo-me a:
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
                <Text>{isBolsista ? (monitor.banco ?? "") : ""}</Text>
              </View>
              <View style={[styles.bankLabel, { width: "20%" }]}>
                <Text>Agência e dígito</Text>
              </View>
              <View style={[styles.bankValue, { width: "15%" }]}>
                <Text>{isBolsista ? (monitor.agencia ?? "") : ""}</Text>
              </View>
              <View style={[styles.bankLabel, { width: "17%" }]}>
                <Text>Conta e dígito**</Text>
              </View>
              <View style={[styles.bankValueLast, { width: "10%" }]}>
                <Text>
                  {isBolsista
                    ? `${monitor.conta ?? ""}${monitor.digitoConta ? `-${monitor.digitoConta}` : ""}`
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
                <Text>{isBolsista ? (monitor.enderecoCompleto ?? "") : ""}</Text>
              </View>
            </View>

            {/* Linha 3 */}
            <View style={styles.bankRow}>
              <View style={[styles.bankLabel, { width: "15%" }]}>
                <Text>Celular com DDD</Text>
              </View>
              <View style={[styles.bankValue, { width: "35%" }]}>
                <Text>{isBolsista ? (monitor.telefone ?? "") : ""}</Text>
              </View>
              <View style={[styles.bankLabel, { width: "12%" }]}>
                <Text>E-mail</Text>
              </View>
              <View style={[styles.bankValueLast, { width: "38%" }]}>
                <Text style={{ color: isBolsista ? "#0000EE" : "#000000" }}>
                  {isBolsista ? monitor.email : ""}
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
            <Text style={styles.lineText}>{formatDateFullBR(dataGeracaoDate)}</Text>
            <Text style={styles.captionText}>Data</Text>
          </View>
          <View style={styles.footerCellSignature}>
            {monitor.assinaturaBase64 ? (
              <Image src={monitor.assinaturaBase64} style={styles.signatureImg} cache={false} />
            ) : null}
            <Text style={styles.lineText}> </Text>
            <Text style={styles.captionText}>Assinatura do(a) monitor(a)</Text>
          </View>
        </View>
      </Page>
    </Document>
  )
}
