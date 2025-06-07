'use client';

import { useAuth } from '@/hooks/use-auth';
import { useProjetos, usePublishResultsData, type ResultadoData } from '@/hooks/use-projeto';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { PagesLayout } from '@/components/layout/PagesLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, FileText } from 'lucide-react';
import { PDFViewer } from '@react-pdf/renderer';
import { ResultadoSelecaoTemplate } from '@/server/lib/pdfTemplates/resultado';
import { toast } from 'sonner';


export const Route = createFileRoute('/home/_layout/professor/_layout/publish-results')({
  component: PublishResultsComponent,
});


function PublishResultsComponent() {
  const { user } = useAuth();
  const { data: allProjects, isLoading: loadingProjects } = useProjetos();
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [resultadoData, setResultadoData] = useState<ResultadoData | null>(null);

  const publishResultsMutation = usePublishResultsData();

  const professorProjects = allProjects?.filter(p => p.professorResponsavelId === user?.id && p.status === 'APPROVED') || [];

  const handleGenerate = (project: any) => {
    setSelectedProject(project);
    toast.promise(publishResultsMutation.mutateAsync(project.id), {
      loading: 'Gerando dados do resultado...',
      success: (data) => {
        setResultadoData(data);
        return 'Dados do resultado gerados com sucesso!';
      },
      error: 'Erro ao gerar dados do resultado.',
    });
  };
  
  if (resultadoData && selectedProject) {
    return (
      <PagesLayout title={`Resultado da Seleção: ${selectedProject.titulo}`}>
         <Button variant="outline" onClick={() => setResultadoData(null)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para a lista de projetos
        </Button>
        <div style={{ height: '80vh' }}>
            <PDFViewer width="100%" height="100%">
                <ResultadoSelecaoTemplate data={resultadoData} />
            </PDFViewer>
        </div>
      </PagesLayout>
    )
  }

  return (
    <PagesLayout title="Publicar Resultados da Seleção" subtitle="Gere o documento de resultado final para seus projetos.">
      <Card>
        <CardHeader>
          <CardTitle>Meus Projetos Aprovados</CardTitle>
        </CardHeader>
        <CardContent>
          {loadingProjects ? (
             <div className="flex justify-center items-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div>
          ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Título do Projeto</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {professorProjects.length > 0 ? (
                professorProjects.map((project) => (
                  <TableRow key={project.id}>
                    <TableCell className="font-medium">{project.titulo}</TableCell>
                    <TableCell><Badge>{project.status}</Badge></TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" onClick={() => handleGenerate(project)} disabled={publishResultsMutation.isPending}>
                        <FileText className="h-4 w-4 mr-2" />
                        Publicar Resultado
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8">
                    Nenhum projeto aprovado encontrado.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          )}
        </CardContent>
      </Card>
    </PagesLayout>
  );
} 