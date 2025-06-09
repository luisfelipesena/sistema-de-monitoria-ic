'use client';

import { PagesLayout } from '@/components/layout/PagesLayout';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { useAluno, useSetAluno } from '@/hooks/use-aluno';
import { useAuth } from '@/hooks/use-auth';
import { useCursos } from '@/hooks/use-curso';
import { useProfessor, useSetProfessor } from '@/hooks/use-professor';
import { useToast } from '@/hooks/use-toast';
import {
  DocumentType,
  useUpdateUserDocument,
  useUserDocuments,
} from '@/hooks/use-user-documents';
import { useUserFileAccess, useFileMetadata } from '@/hooks/use-files';
import { createFileRoute } from '@tanstack/react-router';
import { Eye, Upload } from 'lucide-react';
import { useEffect, useState } from 'react';
import { UserSignatureManager } from '@/components/features/profile/UserSignatureManager';

export const Route = createFileRoute('/home/_layout/common/profile/')({
  component: ProfilePage,
});

type DocumentoUsuario = {
  id: string;
  nome: string;
  fileId?: string;
  fileName?: string;
  ultimaAtualizacao?: string;
  status: 'válido' | 'expirado' | 'pendente';
};

function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);

  if (!user) {
    return (
      <PagesLayout title="Perfil" subtitle="Carregando...">
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      </PagesLayout>
    );
  }

  if (user.role === 'student') {
    return <StudentProfile />;
  } else if (user.role === 'professor') {
    return <ProfessorProfile />;
  } else {
    return (
      <PagesLayout title="Perfil" subtitle="Perfil do administrador">
        <Card className="p-6">
          <div className="text-center space-y-4">
            <h2 className="text-xl font-semibold">Administrador</h2>
            <p className="text-muted-foreground">
              Nome: <strong>{user.username}</strong>
            </p>
            <p className="text-muted-foreground">
              Email: <strong>{user.email}</strong>
            </p>
          </div>
        </Card>
      </PagesLayout>
    );
  }
}

function StudentProfile() {
  const { user } = useAuth();
  const { data: aluno, isLoading } = useAluno();
  const { data: cursos } = useCursos();
  const setAlunoMutation = useSetAluno();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    nomeCompleto: '',
    matricula: '',
    cpf: '',
    cursoId: 0,
    cr: 0,
  });

  useEffect(() => {
    if (aluno) {
      setFormData({
        nomeCompleto: aluno.nomeCompleto || '',
        matricula: aluno.matricula || '',
        cpf: aluno.cpf || '',
        cursoId: aluno.cursoId || 0,
        cr: aluno.cr || 0,
      });
    }
  }, [aluno]);

  const handleSave = async () => {
    try {
      const updateData = {
        ...formData,
        emailInstitucional: user?.email || '',
        genero: 'OUTRO' as const,
      };

      await setAlunoMutation.mutateAsync({
        ...updateData,
        comprovanteMatriculaFileId: 'existing',
      });

      toast({
        title: 'Perfil atualizado',
        description: 'Suas informações foram atualizadas com sucesso',
      });

      setIsEditing(false);
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar',
        description: error.message || 'Não foi possível atualizar o perfil',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = () => {
    if (aluno) {
      setFormData({
        nomeCompleto: aluno.nomeCompleto || '',
        matricula: aluno.matricula || '',
        cpf: aluno.cpf || '',
        cursoId: aluno.cursoId || 0,
        cr: aluno.cr || 0,
      });
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <PagesLayout title="Meu Perfil" subtitle="Carregando seus dados...">
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      </PagesLayout>
    );
  }

  return (
    <PagesLayout
      title="Meu Perfil"
      subtitle="Gerencie suas informações pessoais"
    >
      <div className="space-y-8">
        <Card className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-semibold">Dados Pessoais</h2>
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)}>Editar</Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCancel}>
                  Cancelar
                </Button>
                <Button
                  onClick={handleSave}
                  disabled={setAlunoMutation.isPending}
                >
                  {setAlunoMutation.isPending ? (
                    <div className="flex items-center gap-2">
                      <Spinner />
                      Salvando...
                    </div>
                  ) : (
                    'Salvar'
                  )}
                </Button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nomeCompleto">Nome Completo</Label>
              <Input
                id="nomeCompleto"
                value={formData.nomeCompleto}
                onChange={(e) =>
                  setFormData({ ...formData, nomeCompleto: e.target.value })
                }
                disabled={!isEditing}
              />
            </div>

            <div>
              <Label htmlFor="matricula">Matrícula</Label>
              <Input
                id="matricula"
                value={formData.matricula}
                onChange={(e) =>
                  setFormData({ ...formData, matricula: e.target.value })
                }
                disabled={!isEditing}
              />
            </div>

            <div>
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                value={formData.cpf}
                onChange={(e) =>
                  setFormData({ ...formData, cpf: e.target.value })
                }
                disabled={!isEditing}
              />
            </div>

            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                value={user?.email || ''}
                disabled
                className="bg-gray-50"
              />
            </div>

            <div>
              <Label htmlFor="curso">Curso</Label>
              <Select
                value={formData.cursoId.toString()}
                onValueChange={(value) =>
                  setFormData({ ...formData, cursoId: parseInt(value) })
                }
              >
                <SelectTrigger disabled={!isEditing}>
                  <SelectValue placeholder="Selecione seu curso" />
                </SelectTrigger>
                <SelectContent>
                  {cursos?.map((curso) => (
                    <SelectItem key={curso.id} value={curso.id.toString()}>
                      {curso.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="cr">CR (Coeficiente de Rendimento)</Label>
              <Input
                id="cr"
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={formData.cr}
                onChange={(e) =>
                  setFormData({ ...formData, cr: parseFloat(e.target.value) })
                }
                disabled={!isEditing}
              />
            </div>
          </div>
        </Card>

        <DocumentsSection />

        {/* Seção de Assinatura Digital apenas para professores e admins */}
        {(user?.role === 'professor' || user?.role === 'admin') && (
          <UserSignatureManager />
        )}
      </div>
    </PagesLayout>
  );
}

function ProfessorProfile() {
  const { user } = useAuth();
  const { data: professor, isLoading } = useProfessor();
  const setProfessorMutation = useSetProfessor();
  const { toast } = useToast();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    nomeCompleto: '',
    matriculaSiape: '',
    cpf: '',
    telefone: '',
    telefoneInstitucional: '',
    regime: '' as '20H' | '40H' | 'DE' | '',
  });

  useEffect(() => {
    if (professor) {
      setFormData({
        nomeCompleto: professor.nomeCompleto || '',
        matriculaSiape: professor.matriculaSiape || '',
        cpf: professor.cpf || '',
        telefone: professor.telefone || '',
        telefoneInstitucional: professor.telefoneInstitucional || '',
        regime: professor.regime || '',
      });
    }
  }, [professor]);

  const handleSave = async () => {
    try {
      if (!formData.regime) {
        toast({
          title: 'Campo obrigatório',
          description: 'Por favor, selecione um regime de trabalho',
          variant: 'destructive',
        });
        return;
      }

      await setProfessorMutation.mutateAsync({
        ...formData,
        regime: formData.regime as '20H' | '40H' | 'DE',
        emailInstitucional: user?.email || '',
        genero: 'OUTRO',
        departamentoId: professor?.departamentoId || 1,
      });

      toast({
        title: 'Perfil atualizado',
        description: 'Suas informações foram atualizadas com sucesso',
      });

      setIsEditing(false);
    } catch (error: any) {
      toast({
        title: 'Erro ao atualizar',
        description: error.message || 'Não foi possível atualizar o perfil',
        variant: 'destructive',
      });
    }
  };

  const handleCancel = () => {
    if (professor) {
      setFormData({
        nomeCompleto: professor.nomeCompleto || '',
        matriculaSiape: professor.matriculaSiape || '',
        cpf: professor.cpf || '',
        telefone: professor.telefone || '',
        telefoneInstitucional: professor.telefoneInstitucional || '',
        regime: professor.regime || '',
      });
    }
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <PagesLayout title="Meu Perfil" subtitle="Carregando seus dados...">
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      </PagesLayout>
    );
  }

  return (
    <PagesLayout
      title="Meu Perfil"
      subtitle="Gerencie suas informações pessoais"
    >
      <Card className="p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold">Dados Pessoais</h2>
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>Editar</Button>
          ) : (
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel}>
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={setProfessorMutation.isPending}
              >
                {setProfessorMutation.isPending ? (
                  <div className="flex items-center gap-2">
                    <Spinner />
                    Salvando...
                  </div>
                ) : (
                  'Salvar'
                )}
              </Button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="nomeCompleto">Nome Completo</Label>
            <Input
              id="nomeCompleto"
              value={formData.nomeCompleto}
              onChange={(e) =>
                setFormData({ ...formData, nomeCompleto: e.target.value })
              }
              disabled={!isEditing}
            />
          </div>

          <div>
            <Label htmlFor="matriculaSiape">Matrícula SIAPE</Label>
            <Input
              id="matriculaSiape"
              value={formData.matriculaSiape}
              onChange={(e) =>
                setFormData({ ...formData, matriculaSiape: e.target.value })
              }
              disabled={!isEditing}
            />
          </div>

          <div>
            <Label htmlFor="cpf">CPF</Label>
            <Input
              id="cpf"
              value={formData.cpf}
              onChange={(e) =>
                setFormData({ ...formData, cpf: e.target.value })
              }
              disabled={!isEditing}
            />
          </div>

          <div>
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              value={user?.email || ''}
              disabled
              className="bg-gray-50"
            />
          </div>

          <div>
            <Label htmlFor="telefone">Telefone Pessoal</Label>
            <Input
              id="telefone"
              value={formData.telefone}
              onChange={(e) =>
                setFormData({ ...formData, telefone: e.target.value })
              }
              disabled={!isEditing}
              placeholder="(xx) xxxxx-xxxx"
            />
          </div>

          <div>
            <Label htmlFor="telefoneInstitucional">Telefone Institucional</Label>
            <Input
              id="telefoneInstitucional"
              value={formData.telefoneInstitucional}
              onChange={(e) =>
                setFormData({ ...formData, telefoneInstitucional: e.target.value })
              }
              disabled={!isEditing}
              placeholder="(xx) xxxx-xxxx"
            />
          </div>

          <div>
            <Label htmlFor="regime">Regime de Trabalho</Label>
            <Select
              value={formData.regime}
              onValueChange={(value: '20H' | '40H' | 'DE') =>
                setFormData({ ...formData, regime: value })
              }
            >
              <SelectTrigger disabled={!isEditing}>
                <SelectValue placeholder="Selecione o regime" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="20H">20 horas</SelectItem>
                <SelectItem value="40H">40 horas</SelectItem>
                <SelectItem value="DE">Dedicação Exclusiva</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      <DocumentsSection />

      {/* Seção de Assinatura Digital apenas para professores e admins */}
      {(user?.role === 'professor' || user?.role === 'admin') && (
        <UserSignatureManager />
      )}
    </PagesLayout>
  );
}

type DocumentItemProps = {
  doc: {
    id: string;
    nome: string;
    tipo: DocumentType;
    fileId?: string;
    status: 'valid' | 'pending';
  };
  onUpload: (file: File, documentType: DocumentType) => void;
  isUploading: boolean;
};

function DocumentItem({ doc, onUpload, isUploading }: DocumentItemProps) {
  const { data: metadata, isLoading: isLoadingMetadata } = useFileMetadata(doc.fileId || '');
  const userFileAccessMutation = useUserFileAccess();
  const { toast } = useToast();

  const handleVisualize = () => {
    if (!doc.fileId) {
      toast({
        title: 'Arquivo não encontrado',
        description: 'Este documento ainda não foi enviado.',
        variant: 'destructive',
      });
      return;
    }

    userFileAccessMutation.mutate(
      { fileId: doc.fileId },
      {
        onSuccess: (presignedUrl) => {
          window.open(presignedUrl, '_blank');
        },
        onError: (error) => {
          toast({
            title: 'Erro ao acessar arquivo',
            description: error.message || 'Não foi possível acessar o arquivo',
            variant: 'destructive',
          });
        },
      }
    );
  };

  const displayFileName = metadata?.originalFilename || 'Carregando...';

  return (
    <div className="flex items-center justify-between p-4 border rounded-lg">
      <div className="space-y-1 flex flex-col">
        <span className="font-medium">{doc.nome}</span>
        {doc.fileId && (
          <p className="text-xs text-green-600 bg-green-50 px-2 py-1 rounded w-fit">
            📄 {isLoadingMetadata ? 'Carregando...' : displayFileName}
          </p>
        )}
        <Badge
          variant={doc.status === 'valid' ? 'retaVerde' : 'retaVermelha'}
          className="text-xs w-fit"
        >
          Status: {doc.status === 'valid' ? 'Válido' : 'Pendente'}
        </Badge>
      </div>
      <div className="flex gap-2">
        <input
          type="file"
          id={`upload-${doc.id}`}
          accept=".pdf"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) {
              onUpload(file, doc.tipo);
            }
          }}
        />
        <Button
          variant="outline"
          onClick={() =>
            document.getElementById(`upload-${doc.id}`)?.click()
          }
          disabled={isUploading}
        >
          <Upload className="w-4 h-4 mr-2" />
          {doc.fileId ? 'Alterar' : 'Enviar'}
        </Button>
        {doc.fileId && (
          <Button
            variant="secondary"
            onClick={handleVisualize}
            disabled={userFileAccessMutation.isPending}
          >
            {userFileAccessMutation.isPending ? (
              <div className="flex items-center gap-2">
                <Spinner />
                Carregando...
              </div>
            ) : (
              <>
                <Eye className="w-4 h-4 mr-2" />
                Visualizar
              </>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

function DocumentsSection() {
  const { data: documentos, isLoading } = useUserDocuments();
  const updateDocumentMutation = useUpdateUserDocument();
  const { toast } = useToast();

  const handleUpload = async (
    file: File,
    documentType: DocumentType,
  ) => {
    try {
      await updateDocumentMutation.mutateAsync({
        file,
        documentType,
      });

      toast({
        title: 'Upload realizado',
        description: `${file.name} foi enviado com sucesso`,
      });
    } catch (error) {
      toast({
        title: 'Erro no upload',
        description: 'Não foi possível enviar o arquivo',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return (
      <Card className="p-6">
        <h2 className="text-xl font-semibold mb-6">📄 Documentos</h2>
        <div className="flex justify-center py-4">
          <Spinner />
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h2 className="text-xl font-semibold mb-6">📄 Documentos</h2>
      <div className="space-y-4">
        {documentos?.map((doc) => (
          <DocumentItem
            key={doc.id}
            doc={doc}
            onUpload={handleUpload}
            isUploading={updateDocumentMutation.isPending}
          />
        )) || (
          <p className="text-center text-muted-foreground py-4">
            Nenhum documento encontrado
          </p>
        )}
      </div>
    </Card>
  );
}
