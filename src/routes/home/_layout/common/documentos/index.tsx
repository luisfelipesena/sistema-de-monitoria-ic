import { PagesLayout } from '@/components/layout/PagesLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/use-auth';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import {
  AlertCircle,
  CheckCircle,
  Download,
  FileText,
  Upload,
  XCircle,
} from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export const Route = createFileRoute('/home/_layout/common/documentos/')({
  component: DocumentosPage,
});

interface DocumentoStatus {
  tipo: string;
  nome: string;
  obrigatorio: boolean;
  arquivo?: File;
  status: 'pendente' | 'enviado' | 'validado' | 'rejeitado';
  url?: string;
  feedback?: string;
}

function DocumentosPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [documentos, setDocumentos] = useState<DocumentoStatus[]>([
    {
      tipo: 'COMPROVANTE_MATRICULA',
      nome: 'Comprovante de Matrícula',
      obrigatorio: true,
      status: 'pendente',
    },
    {
      tipo: 'HISTORICO_ESCOLAR',
      nome: 'Histórico Escolar',
      obrigatorio: true,
      status: 'pendente',
    },
    {
      tipo: 'FOTO_3X4',
      nome: 'Foto 3x4',
      obrigatorio: false,
      status: 'pendente',
    },
  ]);

  const [uploadProgress, setUploadProgress] = useState<Record<string, number>>(
    {},
  );

  // Verificar se o usuário é aluno
  if (user?.role !== 'student') {
    return (
      <PagesLayout title="Acesso Negado">
        <div className="text-center py-12">
          <p>Esta página é exclusiva para alunos.</p>
          <Button
            onClick={() => navigate({ to: '/home/common/profile' })}
            className="mt-4"
          >
            Voltar ao Perfil
          </Button>
        </div>
      </PagesLayout>
    );
  }

  const handleFileSelect = (
    tipo: string,
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validações do arquivo
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png'];

    if (file.size > maxSize) {
      toast.error('Arquivo muito grande. Máximo permitido: 5MB');
      return;
    }

    if (!allowedTypes.includes(file.type)) {
      toast.error('Tipo de arquivo não permitido. Use PDF, JPG ou PNG');
      return;
    }

    setDocumentos((prev) =>
      prev.map((doc) =>
        doc.tipo === tipo
          ? { ...doc, arquivo: file, status: 'pendente' as const }
          : doc,
      ),
    );
  };

  const handleUpload = async (documento: DocumentoStatus) => {
    if (!documento.arquivo) return;

    try {
      setUploadProgress((prev) => ({ ...prev, [documento.tipo]: 0 }));

      // Simular progresso de upload
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          const current = prev[documento.tipo] || 0;
          if (current >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return { ...prev, [documento.tipo]: current + 10 };
        });
      }, 200);

      const formData = new FormData();
      formData.append('file', documento.arquivo);
      formData.append('tipoDocumento', documento.tipo);

      // Aqui seria chamada a API de upload
      await new Promise((resolve) => setTimeout(resolve, 2000)); // Simular upload

      clearInterval(progressInterval);
      setUploadProgress((prev) => ({ ...prev, [documento.tipo]: 100 }));

      setDocumentos((prev) =>
        prev.map((doc) =>
          doc.tipo === documento.tipo
            ? { ...doc, status: 'enviado' as const, url: '#' }
            : doc,
        ),
      );

      toast.success(`${documento.nome} enviado com sucesso!`);

      // Auto-preenchimento para comprovante de matrícula
      if (documento.tipo === 'COMPROVANTE_MATRICULA') {
        toast.info(
          'Dados extraídos do comprovante e preenchidos automaticamente.',
        );
      }
    } catch (error) {
      toast.error(`Erro ao enviar ${documento.nome}`);
      setUploadProgress((prev) => ({ ...prev, [documento.tipo]: 0 }));
    }
  };

  const handleRemoveFile = (tipo: string) => {
    setDocumentos((prev) =>
      prev.map((doc) =>
        doc.tipo === tipo
          ? {
              ...doc,
              arquivo: undefined,
              status: 'pendente' as const,
              url: undefined,
            }
          : doc,
      ),
    );
    setUploadProgress((prev) => ({ ...prev, [tipo]: 0 }));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'enviado':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'validado':
        return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'rejeitado':
        return <XCircle className="h-5 w-5 text-red-600" />;
      default:
        return <AlertCircle className="h-5 w-5 text-yellow-600" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'enviado':
        return 'Enviado';
      case 'validado':
        return 'Validado';
      case 'rejeitado':
        return 'Rejeitado';
      default:
        return 'Pendente';
    }
  };

  const documentosObrigatoriosCompletos = documentos
    .filter((doc) => doc.obrigatorio)
    .every((doc) => doc.status === 'enviado' || doc.status === 'validado');

  return (
    <PagesLayout
      title="Meus Documentos"
      subtitle="Gerencie seus documentos para inscrições em monitoria"
    >
      <div className="space-y-6">
        {/* Status Geral */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Status dos Documentos</h3>
                <p className="text-sm text-muted-foreground">
                  {documentosObrigatoriosCompletos
                    ? 'Todos os documentos obrigatórios foram enviados'
                    : 'Alguns documentos obrigatórios ainda precisam ser enviados'}
                </p>
              </div>
              <div className="flex items-center gap-2">
                {documentosObrigatoriosCompletos ? (
                  <CheckCircle className="h-8 w-8 text-green-600" />
                ) : (
                  <AlertCircle className="h-8 w-8 text-yellow-600" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Lista de Documentos */}
        <div className="space-y-4">
          {documentos.map((documento) => (
            <Card key={documento.tipo}>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {documento.nome}
                    {documento.obrigatorio && (
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded">
                        Obrigatório
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(documento.status)}
                    <span className="text-sm font-medium">
                      {getStatusText(documento.status)}
                    </span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {documento.arquivo ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        <span className="text-sm font-medium">
                          {documento.arquivo.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          ({(documento.arquivo.size / 1024 / 1024).toFixed(2)}{' '}
                          MB)
                        </span>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemoveFile(documento.tipo)}
                      >
                        Remover
                      </Button>
                    </div>

                    {uploadProgress[documento.tipo] !== undefined &&
                      uploadProgress[documento.tipo] < 100 && (
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Enviando...</span>
                            <span>{uploadProgress[documento.tipo]}%</span>
                          </div>
                          <Progress value={uploadProgress[documento.tipo]} />
                        </div>
                      )}

                    {documento.status === 'pendente' && (
                      <Button
                        onClick={() => handleUpload(documento)}
                        className="w-full"
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        Enviar Documento
                      </Button>
                    )}

                    {documento.status === 'enviado' && documento.url && (
                      <Button
                        variant="outline"
                        className="w-full"
                        onClick={() => window.open(documento.url, '_blank')}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Visualizar Documento
                      </Button>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 text-center">
                      <Upload className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                      <p className="text-sm text-muted-foreground mb-4">
                        Clique para selecionar ou arraste o arquivo aqui
                      </p>
                      <Label htmlFor={`file-${documento.tipo}`}>
                        <Button variant="outline" asChild>
                          <span>Selecionar Arquivo</span>
                        </Button>
                      </Label>
                      <Input
                        id={`file-${documento.tipo}`}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={(e) => handleFileSelect(documento.tipo, e)}
                        className="hidden"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Formatos aceitos: PDF, JPG, PNG. Tamanho máximo: 5MB
                    </p>
                  </div>
                )}

                {documento.feedback && (
                  <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>Feedback:</strong> {documento.feedback}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Ações */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Próximos Passos</h3>
                <p className="text-sm text-muted-foreground">
                  {documentosObrigatoriosCompletos
                    ? 'Você pode agora se inscrever em projetos de monitoria!'
                    : 'Complete o envio dos documentos obrigatórios para se inscrever.'}
                </p>
              </div>
              <Button
                onClick={() => navigate({ to: '/home/common/monitoria' })}
                disabled={!documentosObrigatoriosCompletos}
              >
                Ver Vagas Disponíveis
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </PagesLayout>
  );
}
