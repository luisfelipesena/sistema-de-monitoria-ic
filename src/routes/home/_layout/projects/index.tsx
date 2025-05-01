'use client';

import { FileUploader } from '@/components/ui/FileUploader';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { logger } from '@/utils/logger';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  Document,
  DocumentProps,
  Page,
  PDFDownloadLink,
  PDFViewer,
  StyleSheet,
  Text,
  View,
} from '@react-pdf/renderer';
import { useDebouncedValue } from '@tanstack/react-pacer';
import { createFileRoute } from '@tanstack/react-router';
import {
  JSXElementConstructor,
  ReactElement,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

const log = logger.child({
  context: 'ProjectsComponent',
});

export const Route = createFileRoute('/home/_layout/projects/')({
  component: ProjectsComponent,
});

// 1. Define Zod Schema for the template form
const templateSchema = z.object({
  professorName: z.string().min(1, 'Nome do professor é obrigatório'),
  projectName: z.string().min(1, 'Nome do projeto é obrigatório'),
  objective: z.string().min(10, 'Objetivo deve ter pelo menos 10 caracteres'),
});

type TemplateFormData = z.infer<typeof templateSchema>;

// 2. Define PDF Document Component using @react-pdf/renderer
const styles = StyleSheet.create({
  page: { flexDirection: 'column', padding: 30, fontFamily: 'Helvetica' }, // Set default or registered font
  section: { marginBottom: 15, padding: 10 }, // Adjusted margin
  heading: {
    fontSize: 14,
    marginBottom: 8, // Adjusted margin
    // fontWeight: 'bold', // Font weight from Font.register if used
    fontFamily: 'Helvetica-Bold', // Use bold variant if available/needed
    textTransform: 'uppercase',
    borderBottomWidth: 1,
    borderBottomColor: '#cccccc',
    paddingBottom: 3,
  },
  text: { fontSize: 11, marginBottom: 4, lineHeight: 1.5 }, // Adjusted line height and margin
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 30,
    right: 30,
    textAlign: 'center',
    color: 'grey',
    fontSize: 9,
  },
});

const ProjectPdfDocument = ({ data }: { data: TemplateFormData }) => (
  <Document
    title={`Proposta - ${data.projectName}`}
    author={data.professorName}
  >
    <Page size="A4" style={styles.page}>
      <View style={styles.section}>
        <Text style={styles.heading}>Proposta de Projeto de Monitoria</Text>
        <Text style={styles.text}>
          Professor(a) Responsável: {data.professorName || '[Nome Professor]'}
        </Text>
        <Text style={styles.text}>
          Nome do Projeto: {data.projectName || '[Nome Projeto]'}
        </Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.heading}>Objetivo Geral</Text>
        <Text style={styles.text}>{data.objective || '[Objetivo Geral]'}</Text>
      </View>
      {/* Add more template sections as needed */}
      <Text style={styles.footer}>
        Documento gerado via Sistema de Monitoria IC
      </Text>
    </Page>
  </Document>
);

// Client-side only wrapper for PDFViewer
const ClientPDFViewer = ({
  document,
}: {
  document: ReactElement<DocumentProps, string | JSXElementConstructor<any>>;
}) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  if (!isClient) {
    return <div>Carregando visualizador de PDF...</div>; // Or a loading spinner
  }

  return (
    <PDFViewer width="100%" height="600px" className="border">
      {document}
    </PDFViewer>
  );
};

// Main Component
function ProjectsComponent() {
  const [uploadedFile, setUploadedFile] = useState<{
    fileId: string;
    fileName: string;
  } | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm<TemplateFormData>({
    resolver: zodResolver(templateSchema),
    mode: 'onChange',
    defaultValues: {
      professorName: '',
      projectName: '',
      objective: '',
    },
  });

  // Watch current form values
  const currentFormData = watch();
  const [debouncedFormData] = useDebouncedValue(currentFormData, {
    wait: 1000,
  });

  const handleFileAccept = (fileData: { fileId: string; fileName: string }) => {
    log.info('Accepted file:', fileData);
    setUploadedFile(fileData);
  };

  const onSubmit = (data: TemplateFormData) => {
    log.info('Form data submitted (optional action):', data);
  };

  // Memoize the PDF document to prevent unnecessary rerenders
  const memoizedPdfDocument = useMemo(() => {
    return <ProjectPdfDocument data={debouncedFormData} />;
  }, [
    debouncedFormData.professorName,
    debouncedFormData.projectName,
    debouncedFormData.objective,
  ]);

  // Create a stable filename for the PDF
  const pdfFileName = useMemo(() => {
    return `proposta_${
      debouncedFormData.projectName
        ?.normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-zA-Z0-9\s]/g, '')
        .replace(/\s+/g, '_') || 'projeto'
    }.pdf`;
  }, [debouncedFormData.projectName]);

  return (
    <div>
      <h1 className="mb-6 text-3xl font-bold text-gray-900">
        Gerenciar Projetos
      </h1>
      <div className="p-6 space-y-8 bg-white rounded-lg shadow">
        {/* Section for PDF Template Generation */}
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {/* Column 1: Form Inputs */}
          <div>
            <h2 className="mb-4 text-xl font-semibold text-gray-800">
              Dados da Proposta (Template)
            </h2>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Professor Name Input */}
              <div>
                <label
                  htmlFor="professorName"
                  className="block mb-1 text-sm font-medium text-gray-700"
                >
                  Nome do Professor Responsável
                </label>
                <Input
                  id="professorName"
                  {...register('professorName')}
                  aria-invalid={errors.professorName ? 'true' : 'false'}
                />
                {errors.professorName && (
                  <p className="mt-1 text-xs text-red-600" role="alert">
                    {errors.professorName.message}
                  </p>
                )}
              </div>

              {/* Project Name Input */}
              <div>
                <label
                  htmlFor="projectName"
                  className="block mb-1 text-sm font-medium text-gray-700"
                >
                  Nome do Projeto
                </label>
                <Input
                  id="projectName"
                  {...register('projectName')}
                  aria-invalid={errors.projectName ? 'true' : 'false'}
                />
                {errors.projectName && (
                  <p className="mt-1 text-xs text-red-600" role="alert">
                    {errors.projectName.message}
                  </p>
                )}
              </div>

              {/* Objective Textarea */}
              <div>
                <label
                  htmlFor="objective"
                  className="block mb-1 text-sm font-medium text-gray-700"
                >
                  Objetivo Geral do Projeto
                </label>
                <textarea
                  id="objective"
                  rows={6} // Adjusted rows
                  {...register('objective')}
                  className="w-full px-3 py-2 mt-1 text-gray-900 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  aria-invalid={errors.objective ? 'true' : 'false'}
                />
                {errors.objective && (
                  <p className="mt-1 text-xs text-red-600" role="alert">
                    {errors.objective.message}
                  </p>
                )}
              </div>

              {/* PDF Download Link - enabled when form is valid */}
              <div className="pt-4">
                {isValid ? (
                  <PDFDownloadLink
                    document={memoizedPdfDocument}
                    fileName={pdfFileName}
                  >
                    {({ loading }) => (
                      <Button
                        type="button"
                        variant="default"
                        disabled={loading}
                      >
                        {loading ? 'Gerando PDF...' : 'Baixar PDF da Proposta'}
                      </Button>
                    )}
                  </PDFDownloadLink>
                ) : (
                  <Button type="button" variant="secondary" disabled>
                    Preencha o formulário para baixar o PDF
                  </Button>
                )}
              </div>
            </form>
          </div>

          {/* Column 2: PDF Preview */}
          <div>
            <h2 className="mb-4 text-xl font-semibold text-gray-800">
              Pré-visualização do PDF
            </h2>
            <ClientPDFViewer document={memoizedPdfDocument} />
          </div>
        </div>

        {/* Separator */}
        <hr className="my-8 border-t border-gray-200" />

        {/* Existing Section for PDF Upload */}
        <div>
          <h2 className="mb-3 text-xl font-semibold text-gray-800">
            Fazer Upload de Proposta Assinada (Arquivo PDF)
          </h2>
          <FileUploader
            entityType="project"
            entityId="123e4567-e89b-12d3-a456-426614174000"
            onUploadComplete={handleFileAccept}
          />
          {uploadedFile && (
            <p className="mt-4 text-sm text-green-600">
              Arquivo selecionado para upload: '{uploadedFile.fileName}'.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
