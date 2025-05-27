'use client';

import { PagesLayout } from '@/components/layout/PagesLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { useProjetos } from '@/hooks/use-projeto';
import { createFileRoute } from '@tanstack/react-router';
import {
  BookOpen,
  Clock,
  FileText,
  GraduationCap,
  Search,
  Users,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

export const Route = createFileRoute(
  '/home/_layout/student/_layout/inscricao-monitoria',
)({
  component: InscricaoMonitoriaPage,
});

interface ApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: any;
  onSubmit: (data: any) => void;
}

function ApplicationModal({
  isOpen,
  onClose,
  project,
  onSubmit,
}: ApplicationModalProps) {
  const [formData, setFormData] = useState({
    motivation: '',
    experience: '',
    availability: '',
    phone: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.motivation.trim()) {
      toast.error('Motivação é obrigatória');
      return;
    }
    onSubmit(formData);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Inscrição em Monitoria</h2>
          <Button variant="outline" onClick={onClose}>
            ×
          </Button>
        </div>

        <div className="mb-6 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold text-blue-900">{project?.titulo}</h3>
          <p className="text-sm text-blue-700">
            Professor: {project?.professorResponsavelNome}
          </p>
          <p className="text-sm text-blue-700">
            Departamento: {project?.departamentoNome}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="motivation">
              Motivação para a Monitoria* (máx. 500 caracteres)
            </Label>
            <Textarea
              id="motivation"
              value={formData.motivation}
              onChange={(e) =>
                setFormData({ ...formData, motivation: e.target.value })
              }
              placeholder="Descreva sua motivação para participar desta monitoria..."
              rows={4}
              maxLength={500}
            />
            <div className="text-sm text-gray-500 text-right">
              {formData.motivation.length}/500
            </div>
          </div>

          <div>
            <Label htmlFor="experience">Experiência Prévia (opcional)</Label>
            <Textarea
              id="experience"
              value={formData.experience}
              onChange={(e) =>
                setFormData({ ...formData, experience: e.target.value })
              }
              placeholder="Descreva sua experiência prévia relacionada à disciplina..."
              rows={3}
              maxLength={300}
            />
          </div>

          <div>
            <Label htmlFor="availability">Disponibilidade de Horários</Label>
            <Textarea
              id="availability"
              value={formData.availability}
              onChange={(e) =>
                setFormData({ ...formData, availability: e.target.value })
              }
              placeholder="Informe sua disponibilidade de horários..."
              rows={2}
              maxLength={200}
            />
          </div>

          <div>
            <Label htmlFor="phone">Telefone para Contato</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) =>
                setFormData({ ...formData, phone: e.target.value })
              }
              placeholder="(xx) xxxxx-xxxx"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancelar
            </Button>
            <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
              Enviar Inscrição
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function InscricaoMonitoriaPage() {
  const { user } = useAuth();
  const { data: projetos, isLoading } = useProjetos();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [applicationModal, setApplicationModal] = useState<{
    isOpen: boolean;
    project: any;
  }>({
    isOpen: false,
    project: null,
  });

  // Filter only approved projects for student applications
  const availableProjects = useMemo(() => {
    if (!projetos) return [];

    return projetos
      .filter((projeto) => projeto.status === 'APPROVED')
      .filter((projeto) => {
        if (searchTerm) {
          const search = searchTerm.toLowerCase();
          return (
            projeto.titulo.toLowerCase().includes(search) ||
            projeto.departamentoNome.toLowerCase().includes(search) ||
            projeto.professorResponsavelNome.toLowerCase().includes(search) ||
            projeto.disciplinas.some((d) =>
              d.nome.toLowerCase().includes(search),
            )
          );
        }
        return true;
      })
      .filter((projeto) => {
        if (selectedDepartment) {
          return projeto.departamentoId.toString() === selectedDepartment;
        }
        return true;
      });
  }, [projetos, searchTerm, selectedDepartment]);

  const departments = useMemo(() => {
    if (!projetos) return [];
    const depts = new Set(
      projetos
        .filter((p) => p.status === 'APPROVED')
        .map((p) => ({
          id: p.departamentoId,
          name: p.departamentoNome,
        })),
    );
    return Array.from(depts).sort((a, b) => a.name.localeCompare(b.name));
  }, [projetos]);

  const handleApplyToProject = (project: any) => {
    setApplicationModal({ isOpen: true, project });
  };

  const handleSubmitApplication = async (applicationData: any) => {
    try {
      // Here would be the API call to submit the application
      console.log('Submitting application:', {
        projectId: applicationModal.project.id,
        ...applicationData,
      });

      toast.success('Inscrição enviada com sucesso!');
      setApplicationModal({ isOpen: false, project: null });
    } catch (error) {
      toast.error('Erro ao enviar inscrição');
    }
  };

  if (user?.role !== 'student') {
    return (
      <PagesLayout title="Acesso Negado">
        <div className="text-center py-12">
          <p className="text-muted-foreground">
            Apenas estudantes podem acessar esta página.
          </p>
        </div>
      </PagesLayout>
    );
  }

  return (
    <PagesLayout
      title="Inscrição em Monitoria"
      subtitle="Candidate-se às vagas de monitoria disponíveis"
    >
      <div className="space-y-6">
        {/* Search and Filters */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Buscar por disciplina, professor ou departamento..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">Todos os Departamentos</option>
            {departments.map((dept) => (
              <option key={dept.id} value={dept.id.toString()}>
                {dept.name}
              </option>
            ))}
          </select>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold text-blue-600">
                    {availableProjects.length}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Projetos Disponíveis
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <Users className="h-5 w-5 text-green-500" />
                <div>
                  <div className="text-2xl font-bold text-green-600">
                    {availableProjects.reduce(
                      (sum, p) => sum + (p.bolsasDisponibilizadas || 0),
                      0,
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Bolsas Disponíveis
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <GraduationCap className="h-5 w-5 text-purple-500" />
                <div>
                  <div className="text-2xl font-bold text-purple-600">
                    {availableProjects.reduce(
                      (sum, p) => sum + p.voluntariosSolicitados,
                      0,
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">
                    Vagas Voluntárias
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Projects List */}
        {isLoading ? (
          <div className="flex justify-center items-center py-8">
            <div className="text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
              <p className="mt-2">Carregando projetos...</p>
            </div>
          </div>
        ) : availableProjects.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <BookOpen className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-700 mb-2">
                Nenhum projeto disponível
              </h3>
              <p className="text-gray-500">
                {searchTerm || selectedDepartment
                  ? 'Tente ajustar os filtros de busca.'
                  : 'Não há projetos abertos para inscrição no momento.'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {availableProjects.map((projeto) => (
              <Card
                key={projeto.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <CardTitle className="text-lg mb-2">
                        {projeto.titulo}
                      </CardTitle>
                      <div className="flex flex-wrap gap-2 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {projeto.professorResponsavelNome}
                        </span>
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-4 w-4" />
                          {projeto.departamentoNome}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {projeto.cargaHorariaSemana}h/semana
                        </span>
                      </div>
                    </div>
                    <Badge variant="success">Disponível</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Disciplinas:</h4>
                      <div className="flex flex-wrap gap-2">
                        {projeto.disciplinas.map((disciplina: any) => (
                          <Badge key={disciplina.id} variant="outline">
                            {disciplina.codigo} - {disciplina.nome}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-medium mb-2">Informações:</h4>
                      <p className="text-gray-700 text-sm">
                        Público-alvo: {projeto.publicoAlvo || 'Não informado'}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-green-50 p-3 rounded">
                        <div className="font-medium text-green-800">
                          Bolsas Disponíveis
                        </div>
                        <div className="text-2xl font-bold text-green-600">
                          {projeto.bolsasDisponibilizadas || 0}
                        </div>
                      </div>
                      <div className="bg-blue-50 p-3 rounded">
                        <div className="font-medium text-blue-800">
                          Vagas Voluntárias
                        </div>
                        <div className="text-2xl font-bold text-blue-600">
                          {projeto.voluntariosSolicitados}
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end">
                      <Button
                        onClick={() => handleApplyToProject(projeto)}
                        className="bg-blue-600 hover:bg-blue-700"
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        Candidatar-se
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      <ApplicationModal
        isOpen={applicationModal.isOpen}
        onClose={() => setApplicationModal({ isOpen: false, project: null })}
        project={applicationModal.project}
        onSubmit={handleSubmitApplication}
      />
    </PagesLayout>
  );
}
