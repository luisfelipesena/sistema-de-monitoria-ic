'use client';

import { PagesLayout } from '@/components/layout/PagesLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/hooks/use-auth';
import { useMinhasInscricoes, useCriarInscricao, useUploadInscricaoDocument } from '@/hooks/use-inscricao';
import { useProjetos } from '@/hooks/use-projeto';
import { DocumentChecklist } from '@/components/features/registration/DocumentChecklist';
import { RequiredDocumentType, REQUIRED_DOCUMENTS_BY_TYPE, validateRequiredDocuments } from '@/lib/document-validation';
import { createFileRoute } from '@tanstack/react-router';
import {
  AlertCircle,
  BookOpen,
  CheckCircle,
  Clock,
  FileText,
  GraduationCap,
  Search,
  Users,
  XCircle,
} from 'lucide-react';
import { useMemo, useState } from 'react';
import { toast } from 'sonner';

export const Route = createFileRoute(
  '/home/_layout/student/_layout/inscricao-monitoria',
)({
  component: InscricaoMonitoriaPage,
});

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface UploadedDocument {
  id: string;
  tipoDocumento: RequiredDocumentType;
  fileId: string;
  fileName: string;
  uploadedAt: Date;
}

interface ApplicationModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: any;
  onSubmit: (data: any) => void;
  isSubmitting?: boolean;
}

function ApplicationModal({
  isOpen,
  onClose,
  project,
  onSubmit,
  isSubmitting = false,
}: ApplicationModalProps) {
  const uploadDocumentMutation = useUploadInscricaoDocument();
  const [formData, setFormData] = useState({
    tipoVagaPretendida: 'ANY' as 'BOLSISTA' | 'VOLUNTARIO' | 'ANY',
    motivation: '',
    experience: '',
    availability: '',
    phone: '',
  });
  
  const [uploadedDocuments, setUploadedDocuments] = useState<UploadedDocument[]>([]);
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);

  // Get validation status for current form
  const documentValidation = validateRequiredDocuments(
    formData.tipoVagaPretendida as keyof typeof REQUIRED_DOCUMENTS_BY_TYPE,
    uploadedDocuments.map(doc => doc.tipoDocumento)
  );

  const handleDocumentUpload = async (data: { tipoDocumento: RequiredDocumentType; file: File }) => {
    setIsUploadingDocument(true);
    try {
      const result = await uploadDocumentMutation.mutateAsync(data);
      
      const newDocument: UploadedDocument = {
        id: `${data.tipoDocumento}-${Date.now()}`,
        tipoDocumento: data.tipoDocumento,
        fileId: result.fileId,
        fileName: data.file.name,
        uploadedAt: new Date(),
      };
      
      setUploadedDocuments(prev => [...prev, newDocument]);
    } catch (error) {
      throw error; // Re-throw to let DocumentChecklist handle the error
    } finally {
      setIsUploadingDocument(false);
    }
  };

  const handleDocumentRemove = async (documentId: string) => {
    setUploadedDocuments(prev => prev.filter(doc => doc.id !== documentId));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.motivation.trim()) {
      toast.error('Motivação é obrigatória');
      return;
    }
    if (!formData.tipoVagaPretendida) {
      toast.error('Selecione o tipo de vaga pretendida');
      return;
    }
    
    // Validate documents
    if (!documentValidation.isValid) {
      toast.error(`Documentos obrigatórios faltando: ${documentValidation.missingDocuments.join(', ')}`);
      return;
    }

    // Convert documents to expected format
    const documentos = uploadedDocuments.map(doc => ({
      tipoDocumento: doc.tipoDocumento,
      fileId: doc.fileId,
    }));

    onSubmit({
      ...formData,
      documentos,
    });
  };

  // Reset form when modal closes
  const handleClose = () => {
    setFormData({
      tipoVagaPretendida: 'ANY',
      motivation: '',
      experience: '',
      availability: '',
      phone: '',
    });
    setUploadedDocuments([]);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Inscrição em Monitoria</h2>
          <Button variant="outline" onClick={handleClose} disabled={isSubmitting}>
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
          <div className="mt-2 flex gap-4 text-sm">
            <span className="text-green-700">
              Bolsas: {project?.bolsasDisponibilizadas || 0}
            </span>
            <span className="text-blue-700">
              Voluntários: {project?.voluntariosSolicitados || 0}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Basic Form */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="tipoVaga">Tipo de Vaga Pretendida*</Label>
                <Select
                  value={formData.tipoVagaPretendida}
                  onValueChange={(value: 'BOLSISTA' | 'VOLUNTARIO' | 'ANY') =>
                    setFormData({ ...formData, tipoVagaPretendida: value })
                  }
            
                >
                  <SelectTrigger disabled={isSubmitting}>
                    <SelectValue placeholder="Selecione o tipo de vaga" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BOLSISTA">
                      Bolsista (apenas bolsa)
                    </SelectItem>
                    <SelectItem value="VOLUNTARIO">
                      Voluntário (apenas voluntário)
                    </SelectItem>
                    <SelectItem value="ANY">
                      Qualquer (bolsa ou voluntário)
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

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
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
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
                  disabled={isSubmitting}
                />
              </div>
            </div>

            {/* Right Column: Document Upload */}
            <div>
              <DocumentChecklist
                tipoVaga={formData.tipoVagaPretendida as keyof typeof REQUIRED_DOCUMENTS_BY_TYPE}
                uploadedDocuments={uploadedDocuments}
                onDocumentUpload={handleDocumentUpload}
                onDocumentRemove={handleDocumentRemove}
                isUploading={isUploadingDocument}
              />
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700"
              disabled={isSubmitting || !documentValidation.isValid}
            >
              {isSubmitting ? 'Enviando...' : 'Enviar Inscrição'}
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
  const {
    data: inscricoes,
    isLoading: loadingInscricoes,
    refetch: refetchInscricoes,
  } = useMinhasInscricoes();
  const criarInscricaoMutation = useCriarInscricao();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [applicationModal, setApplicationModal] = useState<{
    isOpen: boolean;
    project: any;
  }>({
    isOpen: false,
    project: null,
  });

  // Get IDs of projects user has already applied to
  const appliedProjectIds = useMemo(() => {
    if (!inscricoes) return new Set();
    return new Set(inscricoes.map((inscricao) => inscricao.projetoId));
  }, [inscricoes]);

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
    if (!applicationModal.project) return;

    setIsSubmitting(true);
    try {
      await criarInscricaoMutation.mutateAsync({
        projetoId: applicationModal.project.id,
        tipoVagaPretendida: applicationData.tipoVagaPretendida,
        documentos: applicationData.documentos,
      });

      toast.success('Inscrição enviada com sucesso!');
      setApplicationModal({ isOpen: false, project: null });
      refetchInscricoes(); // Refresh applications list
    } catch (error: any) {
      console.error('Error submitting application:', error);
      const errorMessage = error?.response?.data?.error || error?.message || 'Erro ao enviar inscrição';
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return <AlertCircle className="h-4 w-4 text-yellow-500" />;
      case 'SELECTED_BOLSISTA':
      case 'SELECTED_VOLUNTARIO':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'ACCEPTED_BOLSISTA':
      case 'ACCEPTED_VOLUNTARIO':
        return <CheckCircle className="h-4 w-4 text-blue-500" />;
      case 'REJECTED_BY_PROFESSOR':
      case 'REJECTED_BY_STUDENT':
        return <XCircle className="h-4 w-4 text-red-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'SUBMITTED':
        return 'Enviada';
      case 'SELECTED_BOLSISTA':
        return 'Selecionado (Bolsista)';
      case 'SELECTED_VOLUNTARIO':
        return 'Selecionado (Voluntário)';
      case 'ACCEPTED_BOLSISTA':
        return 'Aceito (Bolsista)';
      case 'ACCEPTED_VOLUNTARIO':
        return 'Aceito (Voluntário)';
      case 'REJECTED_BY_PROFESSOR':
        return 'Não Selecionado';
      case 'REJECTED_BY_STUDENT':
        return 'Recusado';
      default:
        return status;
    }
  };

  return (
    <PagesLayout
      title="Inscrição em Monitoria"
      subtitle="Candidate-se às vagas de monitoria disponíveis"
    >
      <div className="space-y-6">
        {/* My Applications Section */}
        {inscricoes && inscricoes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Minhas Inscrições
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {inscricoes.map((inscricao) => (
                  <div
                    key={inscricao.id}
                    className="flex items-center justify-between p-3 border rounded-lg"
                  >
                    <div>
                      <h4 className="font-medium">
                        {inscricao.projeto.titulo}
                      </h4>
                      <p className="text-sm text-gray-600">
                        {inscricao.projeto.professorResponsavel.nomeCompleto}
                      </p>
                      <p className="text-sm text-gray-500">
                        Tipo pretendido:{' '}
                        {inscricao.tipoVagaPretendida === 'ANY'
                          ? 'Qualquer'
                          : inscricao.tipoVagaPretendida}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(inscricao.status)}
                      <span className="text-sm font-medium">
                        {getStatusText(inscricao.status)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

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
          <div className="flex-0 w-1/3 relative">
          <Select
            value={selectedDepartment}
            onValueChange={(value) => setSelectedDepartment(value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Todos os Departamentos" />
            </SelectTrigger>
            <SelectContent>
              {departments.map((dept) => (
                <SelectItem key={dept.id} value={dept.id.toString()}>
                  {dept.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold text-blue-500">
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
                  <div className="text-2xl font-bold text-green-500">
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
                <GraduationCap className="h-5 w-5 text-red-500" />
                <div>
                  <div className="text-2xl font-bold text-red-500">
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
            {availableProjects.map((projeto) => {
              const hasApplied = appliedProjectIds.has(projeto.id);
              return (
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
                      {hasApplied ? (
                        <Badge
                          variant="secondary"
                          className="bg-green-100 text-green-800"
                        >
                          <CheckCircle className="h-3 w-3 mr-1" />
                          Inscrito
                        </Badge>
                      ) : (
                        <Badge variant="outline">Disponível</Badge>
                      )}
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
                          disabled={hasApplied}
                        >
                          <FileText className="h-4 w-4 mr-2" />
                          {hasApplied ? 'Já Inscrito' : 'Candidatar-se'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <ApplicationModal
        isOpen={applicationModal.isOpen}
        onClose={() => setApplicationModal({ isOpen: false, project: null })}
        project={applicationModal.project}
        onSubmit={handleSubmitApplication}
        isSubmitting={isSubmitting}
      />
    </PagesLayout>
  );
}
