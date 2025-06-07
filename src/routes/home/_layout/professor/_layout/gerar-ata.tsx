'use client';

import { useAuth } from '@/hooks/use-auth';
import { useProjetos, useGenerateAtaData, type AtaData } from '@/hooks/use-projeto';
import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { PagesLayout } from '@/components/layout/PagesLayout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Loader2, ArrowLeft, FileText } from 'lucide-react';
import { PDFViewer } from '@react-pdf/renderer';
import { AtaSelecaoTemplate } from '@/server/lib/pdfTemplates/ata';
import { toast } from 'sonner';


export const Route = createFileRoute('/home/_layout/professor/_layout/gerar-ata')({
  component: GerarAtaComponent,
});


function GerarAtaComponent() {
  const { user } = useAuth();
  const { data: allProjects, isLoading: loadingProjects } = useProjetos();
  const [selectedProject, setSelectedProject] = useState<any | null>(null);
  const [ataData, setAtaData] = useState<AtaData | null>(null);

  const generateAtaMutation = useGenerateAtaData();

  const professorProjects = allProjects?.filter(p => p.professorResponsavelId === user?.id && p.status === 'APPROVED') || [];

  const handleGenerate = (project: any) => {
    setSelectedProject(project);
    toast.promise(generateAtaMutation.mutateAsync(project.id), {
      loading: 'Gerando dados da ata...',
      success: (data) => {
        setAtaData(data);
        return 'Dados da ata gerados com sucesso!';
      },
      error: 'Erro ao gerar dados da ata.',
    });
  };
  
  if (ataData && selectedProject) {
    return (
      <PagesLayout title={`Ata de Seleção: ${selectedProject.titulo}`}>
         <Button variant="outline" onClick={() => setAtaData(null)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para a lista de projetos
        </Button>
        <div style={{ height: '80vh' }}>
            <PDFViewer width="100%" height="100%">
                <AtaSelecaoTemplate data={ataData} />
            </PDFViewer>
        </div>
      </PagesLayout>
    )
  }

  return (
    <PagesLayout title="Gerar Ata de Seleção" subtitle="Gere a ata de seleção para seus projetos aprovados.">
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
                      <Button size="sm" onClick={() => handleGenerate(project)} disabled={generateAtaMutation.isPending}>
                        <FileText className="h-4 w-4 mr-2" />
                        Gerar Ata
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