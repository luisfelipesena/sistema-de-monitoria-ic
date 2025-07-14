import { MonitoriaFormData } from "@/types"
import { UFBA_LOGO__FORM_BASE64 } from "@/utils/images"
import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer"
import React from "react"

const styles = StyleSheet.create({
  page: {
    paddingTop: 15,
    paddingBottom: 15,
    fontSize: 8,  // Reduced from 9 to scale down content
    fontFamily: "Helvetica",
    backgroundColor: "#FFFFFF",
    display: "flex",
    flexDirection: "column",
    alignItems: "center", // Center content horizontally
  },
  contentContainer: {
    width: "100%",
    maxWidth: 550, // Slightly wider than form to allow centering
    marginLeft: 15,  // Left margin
    marginRight: 20, // Right margin (0.8cm scaled)
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
  },
  header: {
    fontWeight: "bold",
    display: "flex",
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 13, // 0.45cm
    marginTop: 18, // Further reduced for better page fit
    marginBottom: 6, // Reduced from 9
    width: "100%", // Full width for proper centering
    marginRight: 136, // 5.4cm scaled down for alignment with ANEXO I
  },
  headerImage: {
    height: 60,  // Further reduced to help with page fit
    width: 43,   // Further reduced to help with page fit
  },
  headerText: {
    display: "flex",
    flexDirection: "column",
    fontSize: 10, // Reduced from 11
    fontWeight: "bold",
    textAlign: "center",
  },
  formTitle: {
    fontSize: 9,  // Reduced from 10
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 4,
    width: "100%", // Full width for proper centering
  },
  formContainer: {
    width: 458, // 18.19cm scaled down = ~458 points (originally ~515)
    border: "1pt solid #000",
  },
  sectionHeader: {
    backgroundColor: "#BFBFBF",
    fontWeight: "bold",
    fontSize: 8, // Reduced from 9
    padding: 3,  // Reduced from 4
    borderBottom: "1pt solid #000",
    textAlign: "left",
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "center",
  },
  formRow: {
    borderBottom: "1pt solid #000",
    padding: 3,  // Reduced from 4
    fontSize: 8, // Reduced from 9
    minHeight: 15, // Reduced from 18
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
  },
  formRowTall: {
    padding: 3,  // Reduced from 4
    fontSize: 8, // Reduced from 9
    minHeight: 40, // Reduced from 50
    display: "flex",
    flexDirection: "column",
    justifyContent: "flex-start",
  },
  splitRow: {
    display: "flex",
    flexDirection: "row",
    borderBottom: "1pt solid #000",
    minHeight: 15, // Reduced from 18
  },
  splitLeft: {
    flex: 1,
    padding: 3,  // Reduced from 4
    fontSize: 8, // Reduced from 9
    borderRight: "1pt solid #000",
  },
  splitRight: {
    flex: 1,
    padding: 3,  // Reduced from 4
    fontSize: 8, // Reduced from 9
  },
  threeColumnRow: {
    display: "flex",
    flexDirection: "row",
    borderBottom: "1pt solid #000",
    minHeight: 15, // Reduced from 18
  },
  threeColumnLeft: {
    width: "30%",
    padding: 3,  // Reduced from 4
    fontSize: 8, // Reduced from 9
    borderRight: "1pt solid #000",
  },
  threeColumnMiddle: {
    width: "35%",
    padding: 3,  // Reduced from 4
    fontSize: 8, // Reduced from 9
    borderRight: "1pt solid #000",
  },
  threeColumnRight: {
    width: "35%",
    padding: 3,  // Reduced from 4
    fontSize: 8, // Reduced from 9
  },
  signatureSection: {
    marginTop: 8, // Further reduced from 10 (Option A)
    marginBottom: 6,  // Further reduced from 8 (Option A)
    display: "flex",
    flexDirection: "column",
    fontSize: 8, // Reduced from 9
    width: 458, // Match formContainer width
  },
  signatureBox: {
    width: 130, // Reduced from 150
    height: 38,  // Reduced from 45
    borderWidth: 1, // Minimal border width (can't be 0)
    borderColor: "white", // White border to be invisible on white background
    alignSelf: "flex-end",
    marginRight: 116.5, // Same as activeSignatureBox
    marginTop: -3,      // Same as activeSignatureBox
    marginBottom: -6,   // Same as activeSignatureBox
  },
  activeSignatureBox: {
    width: 130, // Reduced from 150
    height: 38,  // Reduced from 45
    borderWidth: 2,
    borderColor: "#0066cc",
    backgroundColor: "#f0f8ff",
    alignSelf: "flex-end",
    marginRight: 116.5, // Adjust to align with signature space
    marginTop: -3,
    marginBottom: -6,  // Pull down to overlap with signature line
  },
  signatureImage: {
    width: "100%", // Fill the entire signature box
    height: "100%", // Fill the entire signature box
    objectFit: "contain",
  },
  instructionsSection: {
    marginTop: 5,  // Further reduced from 8 (Option A)
    fontSize: 6,  // Further reduced from 7 (Option A)
    width: 458, // Match formContainer width
  },
  instructionTitle: {
    fontSize: 7,  // Further reduced from 8 (Option A)
    fontWeight: "bold",
    textDecoration: "underline",
    marginBottom: 3, // Further reduced from 4 (Option A)
  },
  instructionItem: {
    marginBottom: 1, // Further reduced from 2 (Option A)
    display: "flex",
    flexDirection: "row",
  },
  instructionNumber: {
    fontWeight: "bold",
    marginRight: 8,
    width: 15,
  },
  redText: {
    color: "red",
    fontWeight: "bold",
  },
  adminSignatureContainer: {
    position: "absolute",
    top: 20,     // Top margin from page edge
    right: 40,   // Right margin from page edge
    display: "flex",
    flexDirection: "column",
  },
  adminSignatureTitle: {
    fontSize: 8,
    fontWeight: "bold",
    marginBottom: 3,
  },
  adminSignatureBox: {
    width: 130, // Reduced from 150
    height: 38,  // Reduced from 45
    borderWidth: 1, // Minimal border width (can't be 0)
    borderColor: "white", // White border to be invisible on white background
  },
  activeAdminSignatureBox: {
    width: 130, // Reduced from 150
    height: 38,  // Reduced from 45
    borderWidth: 2,
    borderColor: "#0066cc",
    backgroundColor: "#f0f8ff",
  },
})

const MonitoriaFormTemplateComponent = ({ data }: { data: MonitoriaFormData }) => {
  // Calculate derived values
  const disciplinasText = data.disciplinas?.map((d) => `${d.codigo} - ${d.nome}`).join(", ") || "Não informado"
  const cargaHorariaTotal = (data.cargaHorariaSemana || 0) * (data.numeroSemanas || 0)
  
  // Break description into blocks
  const descricaoText = data.descricao || "Descrição do projeto não informada."
  const descricaoLines = []
  const words = descricaoText.split(' ')
  let currentLine = ''
  
  for (const word of words) {
    if ((currentLine + word).length > 120) {
      if (currentLine) {
        descricaoLines.push(currentLine.trim())
        currentLine = word + ' '
      } else {
        descricaoLines.push(word)
        currentLine = ''
      }
    } else {
      currentLine += word + ' '
    }
  }
  if (currentLine.trim()) {
    descricaoLines.push(currentLine.trim())
  }
  
  // Ensure we have 9 lines for description
  while (descricaoLines.length < 9) {
    descricaoLines.push('')
  }

  return (
        <Document>
      <Page size="A4" style={styles.page}>
        {/* Admin Signature - Top Right */}
        {(data.signingMode === "admin" || data.assinaturaAdmin) && (
          <View style={styles.adminSignatureContainer}>
            <Text style={styles.adminSignatureTitle}>Assinatura do Coordenador(a):</Text>
            {data.signingMode === "admin" && (
              <View style={styles.activeAdminSignatureBox}>
                {data.assinaturaAdmin && (
                  <Image src={data.assinaturaAdmin} style={styles.signatureImage} />
                )}
              </View>
            )}
            {data.assinaturaAdmin && data.signingMode !== "admin" && (
              <View style={styles.adminSignatureBox}>
                <Image src={data.assinaturaAdmin} style={styles.signatureImage} />
              </View>
            )}
          </View>
        )}

        {/* Header - Centered on page */}
        <View style={styles.header}>
          <Image style={styles.headerImage} src={UFBA_LOGO__FORM_BASE64} cache={false} />
          <View style={styles.headerText}>
            <Text>UNIVERSIDADE FEDERAL DA BAHIA</Text>
            <Text>Pró-Reitoria de Ensino de Graduação</Text>
            <Text>Coordenação Acadêmica de Graduação</Text>
          </View>
        </View>

        {/* Title - Centered on page */}
        <Text style={styles.formTitle}>ANEXO I - FORMULÁRIO PARA PROJETO DE MONITORIA</Text>

        {/* Content with asymmetric margins */}
        <View style={styles.contentContainer}>

        {/* Form Container */}
        <View style={styles.formContainer}>
          {/* Section 1 */}
          <Text style={styles.sectionHeader}>1 IDENTIFICAÇÃO DO PROJETO</Text>
          
          <View style={styles.formRow}>
            <Text>1.1 Unidade Universitária: Instituto de Computação</Text>
          </View>
          
          <View style={styles.formRow}>
            <Text>1.2 Órgão (Departamento ou Coord. Acadêmica): {data.departamento?.nome || "Não selecionado"}</Text>
          </View>
          
          <View style={styles.formRow}>
            <Text>1.3 Data da reunião de aprovação: {data.dataAprovacao || "--"}</Text>
          </View>
          
          <View style={styles.formRow}>
            <Text>1.4 Componente curricular (código e nome): {disciplinasText}</Text>
          </View>
          
          <View style={styles.formRow}>
            <Text>1.5 Período das atividades de monitoria:    {data.ano}.1 ( {data.semestre === "SEMESTRE_1" ? "X" : ""} )    {data.ano}.2 ( {data.semestre === "SEMESTRE_2" ? "X" : ""} )</Text>
          </View>
          
          <View style={styles.formRow}>
            <Text>1.6 Monitoria voluntária ( {data.voluntariosSolicitados > 0 ? "X" : ""} )                    1.7 Monitoria com bolsa ( {data.bolsasSolicitadas > 0 ? "X" : ""} )</Text>
          </View>
          
          <View style={styles.formRow}>
            <Text>1.8 Número previsto de vagas:   Monitor(a) Bolsista(a) ( {data.bolsasSolicitadas || 0} )    Monitor(a) Voluntário(a) ( {data.voluntariosSolicitados || 0} )</Text>
          </View>
          
          <View style={styles.splitRow}>
            <View style={styles.splitLeft}>
              <Text>1.9 Carga horária semanal: {data.cargaHorariaSemana || 0}h</Text>
            </View>
            <View style={styles.splitRight}>
              <Text>1.10 Carga horária total por semestre: {cargaHorariaTotal}h</Text>
            </View>
          </View>
          
          <View style={styles.formRow}>
            <Text>1.11 Público-alvo: a. Estudantes de graduação ( {data.publicoAlvo === "Estudantes de graduação" ? "X" : ""} ) b. Outros, informar qual ( {data.publicoAlvo === "Estudantes de graduação" ? "" : "X"} ): {data.publicoAlvo === "Estudantes de graduação" ? "" : data.publicoAlvo}</Text>
          </View>
          
          <View style={styles.formRow}>
            <Text>1.12 Quantitativo previsto de pessoas a serem atendidas com o projeto: ( {data.estimativaPessoasBenificiadas || "--"} )</Text>
          </View>

          {/* Section 2 */}
          <Text style={styles.sectionHeader}>2 DADOS DO PROFESSOR RESPONSÁVEL PELO PROJETO</Text>
          
          <View style={styles.formRow}>
            <Text>2.1 Nome Completo: {data.professorResponsavel?.nomeCompleto || (data.user?.role !== "admin" ? data.user?.nomeCompleto : "") || "Não informado"}</Text>
          </View>
          
          <View style={styles.splitRow}>
            <View style={styles.splitLeft}>
              <Text>2.2 CPF: {data.professorResponsavel?.cpf || "Não informado"}</Text>
            </View>
            <View style={styles.splitRight}>
              <Text>2.3 Nº SIAPE: {data.professorResponsavel?.matriculaSiape || "Não informado"}</Text>
            </View>
          </View>
          
          <View style={styles.threeColumnRow}>
            <View style={styles.threeColumnLeft}>
              <Text>2.4 Feminino: ( {data.professorResponsavel?.genero === "FEMININO" ? "X" : ""} ) Masculino: ( {data.professorResponsavel?.genero === "MASCULINO" ? "X" : ""} )</Text>
            </View>
            <View style={styles.threeColumnMiddle}>
              <Text>2.5 Tel. Institucional: {data.professorResponsavel?.telefoneInstitucional || "Não informado"}</Text>
            </View>
            <View style={styles.threeColumnRight}>
              <Text>2.6 Tel. Celular: {data.professorResponsavel?.telefone || "Não informado"}</Text>
            </View>
          </View>
          
          <View style={styles.formRow}>
            <Text>2.7 E-mail: {data.professorResponsavel?.emailInstitucional || data.user?.email || "Não informado"}</Text>
          </View>

          {/* Section 3 */}
          <Text style={styles.sectionHeader}>3 DESCRIÇÃO DO PROJETO</Text>
          {descricaoLines.map((line, index) => (
            <View key={index} style={styles.formRow}>
              <Text>{line}</Text>
            </View>
          ))}

          {/* Section 4 */}
          <Text style={styles.sectionHeader}>4 ATIVIDADES QUE SERÃO DESENVOLVIDAS PELOS(AS) MONITORES(AS)</Text>
          <View style={styles.formRow}>
            <Text>Auxiliar o professor na elaboração de problemas para listas e provas</Text>
          </View>
          <View style={styles.formRow}>
            <Text>Auxiliar os alunos no uso das plataformas de submissão de problemas</Text>
          </View>
          <View style={styles.formRow}>
            <Text>Auxiliar os alunos quanto ao uso das técnicas e comandos de programação</Text>
          </View>
          <View style={styles.formRow}>
            <Text>Auxiliar os alunos em horário extra classe</Text>
          </View>
          <View style={styles.formRow}>
            <Text>Outras atividades relacionadas ao projeto de monitoria</Text>
          </View>
          <View style={styles.formRow}>
            <Text></Text>
          </View>

          {/* Section 5 */}
          <Text style={styles.sectionHeader}>5. DECLARAÇÃO</Text>
          <View style={styles.formRowTall}>
            <Text>Declaro ter conhecimento da Resolução n. 06/2012 do CAE e das normas descritas no Edital 001/{data.ano}/PROGRAD – Projetos de Monitoria com Bolsa ( {data.semestre === "SEMESTRE_1" ? "X" : ""} ).</Text>
            <Text style={{ marginTop: 8 }}>Declaro ter conhecimento da Resolução n. 06/2012 do CAE e das normas descritas no Edital 002/{data.ano}/PROGRAD – Projetos de Monitoria com Bolsa ( {data.semestre === "SEMESTRE_2" ? "X" : ""} ).</Text>
          </View>
        </View>

        {/* Professor Signature */}
        <View style={styles.signatureSection}>
          {/* Signature box first - positioned before text */}
          {data.signingMode === "professor" && (
            <View style={styles.activeSignatureBox}>
              {data.assinaturaProfessor && (
                <Image src={data.assinaturaProfessor} style={styles.signatureImage} />
              )}
            </View>
          )}
          {data.assinaturaProfessor && !data.signingMode && (
            <View style={styles.signatureBox}>
              <Image src={data.assinaturaProfessor} style={styles.signatureImage} />
            </View>
          )}
          
          {/* Text line second - signature box overlaps this */}
          <Text style={{ fontWeight: "bold" }}>Data e Assinatura do Prof(a). responsável: {data.dataAssinaturaProfessor || new Date().toLocaleDateString("pt-BR")} / ______________________________</Text>
        </View>

        {/* Instructions - Same width as formContainer */}
        <View style={styles.instructionsSection}>
            <Text style={styles.instructionTitle}>ROTEIRO PARA ELABORAÇÃO DO PROJETO:</Text>
            
            <View style={styles.instructionItem}>
              <Text style={styles.instructionNumber}>1.</Text>
              <Text>O projeto deverá ser aprovado pelo Departamento e Congregação da Unidade Universitária.</Text>
            </View>
            
            <View style={styles.instructionItem}>
              <Text style={styles.instructionNumber}>2.</Text>
              <Text>O número máximo de monitores: <Text style={{ fontWeight: "bold" }}>1 (um) por professor(a) de 20 horas, 2 (dois) por professor(a) de 40 horas e 3 (três) por professor(a) DE.</Text></Text>
            </View>
            
            <View style={styles.instructionItem}>
              <Text style={styles.instructionNumber}>3.</Text>
              <Text>As <Text style={{ fontWeight: "bold" }}>Congregações</Text> deverão encaminhar à PROGRAD os projetos elaborados pelos(as) professores(as), conforme descrito em edital.</Text>
            </View>
            
            <View style={styles.instructionItem}>
              <Text style={styles.instructionNumber}>4.</Text>
              <Text>No projeto <Text style={{ fontWeight: "bold" }}>poderá</Text> constar a previsão de vagas para monitores(as) bolsistas e voluntários(as), desde que os prazos definidos em edital próprio para cada modalidade sejam acatados.</Text>
            </View>
            
            <View style={styles.instructionItem}>
              <Text style={styles.instructionNumber}>5.</Text>
              <Text>O preenchimento de todos os dados deste formulário é indispensável.</Text>
            </View>
            
            <View style={styles.instructionItem}>
              <Text style={styles.instructionNumber}>6.</Text>
              <Text style={styles.redText}>CASO SEJA PROJETO EM GRUPO, ANEXAR RELAÇÃO DE PROFESSORES PARTICIPANTES DO PROJETO, COM OS MESMOS DADOS SOLICITADOS ACIMA.</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  )
}

export const MonitoriaFormTemplate = React.memo(MonitoriaFormTemplateComponent) as React.FC<{ data: MonitoriaFormData }>
