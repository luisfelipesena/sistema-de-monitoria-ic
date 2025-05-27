import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  downloadPDFFile,
  generateProjetoHTML,
  ProjetoTemplateData,
} from '@/utils/projeto-pdf-generator';
import { FileText } from 'lucide-react';
import { toast } from 'sonner';

interface ProjetoPdfPreviewProps {
  data: ProjetoTemplateData | null;
  onGeneratePDF?: () => Promise<void>;
}

export function ProjectPdfPreview({
  data,
  onGeneratePDF,
}: ProjetoPdfPreviewProps) {
  const handleGeneratePDF = async () => {
    if (!data) {
      toast.error('Dados do projeto não disponíveis');
      return;
    }

    if (onGeneratePDF) {
      await onGeneratePDF();
      return;
    }

    if (
      !data.formData.titulo ||
      !data.formData.descricao ||
      !data.departamento
    ) {
      toast.error('Preencha todos os campos obrigatórios para gerar o PDF');
      return;
    }

    try {
      const { pdf, Document, Page, Text, View, StyleSheet } = await import(
        '@react-pdf/renderer'
      );

      const styles = StyleSheet.create({
        page: {
          flexDirection: 'column',
          backgroundColor: '#FFFFFF',
          padding: 20,
          fontSize: 11,
          fontFamily: 'Helvetica',
        },
        header: {
          textAlign: 'center',
          marginBottom: 20,
        },
        title: {
          fontSize: 14,
          fontWeight: 'bold',
          textAlign: 'center',
          margin: '20 0',
        },
        section: {
          border: '2px solid #000',
          marginBottom: 10,
        },
        sectionHeader: {
          backgroundColor: '#d0d0d0',
          fontWeight: 'bold',
          padding: 5,
          borderBottom: '1px solid #000',
        },
        formRow: {
          borderBottom: '1px solid #000',
          padding: 4,
          minHeight: 18,
          flexDirection: 'row',
          alignItems: 'center',
        },
        fieldLabel: {
          fontWeight: 'bold',
          marginRight: 5,
        },
        fieldValue: {
          flex: 1,
        },
        descriptionBox: {
          minHeight: 100,
          padding: 10,
          border: '1px solid #000',
          margin: '10 0',
        },
      });

      const semestreLabel =
        data.formData.semestre === 'SEMESTRE_1'
          ? `${data.formData.ano}.1`
          : `${data.formData.ano}.2`;

      const tipoProposicaoLabel =
        data.formData.tipoProposicao === 'INDIVIDUAL'
          ? 'Individual'
          : 'Coletiva';

      const disciplinasText = data.disciplinas
        .map((d) => `${d.codigo} - ${d.nome}`)
        .join(', ');

      const MyDocument = () => (
        <Document>
          <Page size="A4" style={styles.page}>
            <View style={styles.header}>
              <Text style={{ fontWeight: 'bold', marginBottom: 10 }}>
                UNIVERSIDADE FEDERAL DA BAHIA{'\n'}
                Pró - Reitoria de Ensino de Graduação{'\n'}
                Coordenação Acadêmica de Graduação
              </Text>
            </View>

            <Text style={styles.title}>
              ANEXO I – FORMULÁRIO PARA SUBMISSÃO DE PROJETO DE MONITORIA
            </Text>

            <View style={styles.section}>
              <Text style={styles.sectionHeader}>
                1. IDENTIFICAÇÃO DO PROJETO
              </Text>

              <View style={styles.formRow}>
                <Text style={styles.fieldLabel}>
                  1.1 Unidade Universitária:
                </Text>
                <Text style={styles.fieldValue}>Instituto de Computação</Text>
              </View>

              <View style={styles.formRow}>
                <Text style={styles.fieldLabel}>1.2 Órgão responsável:</Text>
                <Text style={styles.fieldValue}>
                  {data.departamento?.nome || 'Não selecionado'}
                </Text>
              </View>

              <View style={styles.formRow}>
                <Text style={styles.fieldLabel}>1.3 Título:</Text>
                <Text style={styles.fieldValue}>{data.formData.titulo}</Text>
              </View>

              <View style={styles.formRow}>
                <Text style={styles.fieldLabel}>
                  1.4 Componente(s) curricular(es):
                </Text>
                <Text style={styles.fieldValue}>
                  {disciplinasText || 'Nenhuma disciplina selecionada'}
                </Text>
              </View>

              <View style={styles.formRow}>
                <Text style={styles.fieldLabel}>1.5 Semestre:</Text>
                <Text style={styles.fieldValue}>{semestreLabel}</Text>
              </View>

              <View style={styles.formRow}>
                <Text style={styles.fieldLabel}>1.6 Proposição:</Text>
                <Text style={styles.fieldValue}>{tipoProposicaoLabel}</Text>
              </View>

              <View style={styles.formRow}>
                <Text style={styles.fieldLabel}>1.7 Número de monitores:</Text>
                <Text style={styles.fieldValue}>
                  {(data.formData.bolsasSolicitadas || 0) +
                    (data.formData.voluntariosSolicitados || 0)}
                </Text>
              </View>

              <View style={styles.formRow}>
                <Text style={styles.fieldLabel}>
                  1.8 Carga horária semanal:
                </Text>
                <Text style={styles.fieldValue}>
                  {data.formData.cargaHorariaSemana || 0}h
                </Text>
              </View>

              <View style={styles.formRow}>
                <Text style={styles.fieldLabel}>1.9 Carga horária total:</Text>
                <Text style={styles.fieldValue}>
                  {(data.formData.cargaHorariaSemana || 0) *
                    (data.formData.numeroSemanas || 0)}
                  h
                </Text>
              </View>

              <View style={styles.formRow}>
                <Text style={styles.fieldLabel}>1.10 Público-alvo:</Text>
                <Text style={styles.fieldValue}>
                  {data.formData.publicoAlvo || 'Não informado'}
                </Text>
              </View>

              <View style={styles.formRow}>
                <Text style={styles.fieldLabel}>
                  1.11 Estimativa de beneficiados:
                </Text>
                <Text style={styles.fieldValue}>
                  {data.formData.estimativaPessoasBenificiadas ||
                    'Não informado'}
                </Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionHeader}>
                2. DADOS DO PROFESSOR RESPONSÁVEL
              </Text>
              <View style={{ padding: 5 }}>
                <Text>
                  Nome: {data.user?.username || 'Professor Responsável'}
                </Text>
                <Text>E-mail: {data.user?.email || 'professor@ufba.br'}</Text>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionHeader}>3. DESCRIÇÃO DO PROJETO</Text>
              <View style={styles.descriptionBox}>
                <Text>{data.formData.descricao}</Text>
              </View>
            </View>
          </Page>
        </Document>
      );

      const blob = await pdf(<MyDocument />).toBlob();
      const fileName = `projeto-monitoria-${data.formData.titulo?.replace(/[^a-zA-Z0-9]/g, '-')}.pdf`;

      downloadPDFFile(blob, fileName);
      toast.success('PDF gerado e download iniciado!');
    } catch (error) {
      console.error('Erro ao gerar PDF:', error);
      toast.error('Erro ao gerar PDF do projeto');
    }
  };

  if (!data) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Pré-visualização do edital
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-muted/20 border rounded-md p-8 text-center">
            <FileText className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground mb-4">
              Preencha os campos do formulário para ver a pré-visualização do
              projeto
            </p>
            <p className="text-xs text-muted-foreground">
              A pré-visualização será atualizada automaticamente conforme você
              preenche o formulário
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const htmlPreview = generateProjetoHTML(data);

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Pré-visualização do edital
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div
            dangerouslySetInnerHTML={{ __html: htmlPreview }}
            className="border rounded-lg"
          />

          <div className="flex justify-center">
            <Button
              type="button"
              variant="outline"
              size="lg"
              onClick={handleGeneratePDF}
            >
              <FileText className="h-4 w-4 mr-2" />
              Gerar PDF Prévia
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
