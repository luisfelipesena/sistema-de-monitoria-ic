'use client';

import { PagesLayout } from '@/components/layout/PagesLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/hooks/use-auth';
import { useProjetos } from '@/hooks/use-projeto';
import { useApplicationGrading, useInscricoesProjeto } from '@/hooks/use-inscricao';
import { createFileRoute } from '@tanstack/react-router';
import { Loader2, ArrowLeft, Save } from 'lucide-react';
import { useState, useEffect } from 'react';
import { toast } from 'sonner';

export const Route = createFileRoute('/home/_layout/professor/_layout/grade-applications')({
  component: GradeApplicationsComponent,
});

function ApplicantGradingRow({ applicant }: { applicant: any }) {
  const [grades, setGrades] = useState({
    notaDisciplina: applicant.notaDisciplina || '',
    notaSelecao: applicant.notaSelecao || '',
    coeficienteRendimento: applicant.coeficienteRendimento || '',
  });
  const [notaFinal, setNotaFinal] = useState<string | null>(
    applicant.notaFinal || null,
  );

  const gradingMutation = useApplicationGrading();

  useEffect(() => {
    const { notaDisciplina, notaSelecao, coeficienteRendimento } = grades;
    const nD = parseFloat(notaDisciplina);
    const nS = parseFloat(notaSelecao);
    const cR = parseFloat(coeficienteRendimento);

    if (!isNaN(nD) && !isNaN(nS) && !isNaN(cR)) {
      const final = (nD * 5 + nS * 3 + cR * 2) / 10;
      setNotaFinal(final.toFixed(2));
    } else {
      setNotaFinal(null);
    }
  }, [grades]);

  const handleGradeChange = (field: keyof typeof grades, value: string) => {
    setGrades((prev) => ({ ...prev, [field]: value }));
  };

  const handleSaveGrades = () => {
    const parsedGrades = {
      notaDisciplina: parseFloat(grades.notaDisciplina),
      notaSelecao: parseFloat(grades.notaSelecao),
      coeficienteRendimento: parseFloat(grades.coeficienteRendimento),
    };

    if (Object.values(parsedGrades).some(isNaN)) {
      toast.error('Todas as notas devem ser números válidos.');
      return;
    }

    if (
      Object.values(parsedGrades).some((nota) => nota < 0 || nota > 10)
    ) {
      toast.error('As notas devem estar entre 0 and 10.');
      return;
    }

    toast.promise(
      gradingMutation.mutateAsync({
        inscricaoId: applicant.id,
        ...parsedGrades,
      }),
      {
        loading: 'Salvando notas...',
        success: 'Notas salvas com sucesso!',
        error: 'Erro ao salvar notas.',
      },
    );
  };

  return (
    <TableRow>
      <TableCell className="font-medium">{applicant.aluno.nomeCompleto}</TableCell>
      <TableCell>{applicant.aluno.matricula}</TableCell>
      <TableCell>
        <Input
          type="number"
          step="0.1"
          min="0"
          max="10"
          value={grades.notaDisciplina}
          onChange={(e) => handleGradeChange('notaDisciplina', e.target.value)}
          className="w-24"
        />
      </TableCell>
      <TableCell>
        <Input
          type="number"
          step="0.1"
          min="0"
          max="10"
          value={grades.notaSelecao}
          onChange={(e) => handleGradeChange('notaSelecao', e.target.value)}
          className="w-24"
        />
      </TableCell>
       <TableCell>
        <Input
          type="number"
          step="0.1"
          min="0"
          max="10"
          value={grades.coeficienteRendimento}
          onChange={(e) => handleGradeChange('coeficienteRendimento', e.target.value)}
          className="w-24"
        />
      </TableCell>
      <TableCell className="text-center">{notaFinal || '-'}</TableCell>
      <TableCell className="text-right">
        <Button size="sm" onClick={handleSaveGrades} disabled={gradingMutation.isPending}>
          <Save className="h-4 w-4 mr-2" />
          Salvar
        </Button>
      </TableCell>
    </TableRow>
  );
}

function GradeApplicationsComponent() {
  const { user } = useAuth();
  const { data: allProjects, isLoading: loadingProjects } = useProjetos();
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);

  const { data: applicants, isLoading: loadingApplicants } = useInscricoesProjeto(
    selectedProjectId || 0,
  );

  const professorProjects =
    allProjects?.filter((p) => p.professorResponsavelId === user?.id) || [];

  if (loadingProjects) {
    return (
      <PagesLayout title="Avaliar Candidatos">
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </PagesLayout>
    );
  }
  
  if (selectedProjectId) {
    const selectedProject = professorProjects.find(p => p.id === selectedProjectId);
    return (
      <PagesLayout
        title={`Avaliar Candidatos: ${selectedProject?.titulo}`}
        subtitle="Insira as notas para cada candidato inscrito no projeto."
      >
        <Button variant="outline" onClick={() => setSelectedProjectId(null)} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para a lista de projetos
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Candidatos Inscritos</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingApplicants ? (
               <div className="flex justify-center items-center py-8">
                 <Loader2 className="h-8 w-8 animate-spin" />
               </div>
            ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome do Candidato</TableHead>
                  <TableHead>Matrícula</TableHead>
                  <TableHead>Nota da Disciplina</TableHead>
                  <TableHead>Nota da Seleção</TableHead>
                  <TableHead>CR do Aluno</TableHead>
                  <TableHead>Nota Final</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {applicants && applicants.length > 0 ? (
                  applicants.map((applicant) => (
                    <ApplicantGradingRow key={applicant.id} applicant={applicant} />
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      Nenhum candidato inscrito para este projeto.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            )}
          </CardContent>
        </Card>
      </PagesLayout>
    )
  }

  return (
    <PagesLayout
      title="Avaliar Candidatos"
      subtitle="Selecione um de seus projetos para começar a avaliar os candidatos."
    >
      <Card>
        <CardHeader>
          <CardTitle>Meus Projetos</CardTitle>
        </CardHeader>
        <CardContent>
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
                    <TableCell>
                      <Badge>{project.status}</Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button size="sm" onClick={() => setSelectedProjectId(project.id)}>
                        Avaliar Candidatos
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} className="text-center py-8">
                    Você não tem projetos para avaliar.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </PagesLayout>
  );
} 