import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { 
  useUserSignature, 
  useSaveUserSignature, 
  useDeleteUserSignature 
} from '@/hooks/use-user-signature';
import { ProjectSignaturePad } from '@/components/features/projects/ProjectSignaturePad';
import { 
  PenTool, 
  CheckCircle, 
  Trash2, 
  Upload,
  Eye 
} from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export function UserSignatureManager() {
  const { toast } = useToast();
  const { data: signature, isLoading } = useUserSignature();
  const saveSignatureMutation = useSaveUserSignature();
  const deleteSignatureMutation = useDeleteUserSignature();
  
  const [showSignaturePad, setShowSignaturePad] = useState(false);
  const [previewSignature, setPreviewSignature] = useState<string | null>(null);

  const handleSaveSignature = async (signatureData: string) => {
    try {
      await saveSignatureMutation.mutateAsync({
        signatureImage: signatureData,
      });
      toast({
        title: 'Assinatura salva',
        description: 'Sua assinatura foi salva com sucesso!',
      });
      setShowSignaturePad(false);
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Não foi possível salvar a assinatura',
        variant: 'destructive',
      });
    }
  };

  const handleDeleteSignature = async () => {
    try {
      await deleteSignatureMutation.mutateAsync();
      toast({
        title: 'Assinatura removida',
        description: 'Sua assinatura foi removida com sucesso',
      });
    } catch (error: any) {
      toast({
        title: 'Erro ao remover',
        description: error.message || 'Não foi possível remover a assinatura',
        variant: 'destructive',
      });
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Formato inválido',
        description: 'Por favor, selecione uma imagem',
        variant: 'destructive',
      });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      handleSaveSignature(result);
    };
    reader.readAsDataURL(file);
  };

  const handlePreviewSignature = () => {
    if (signature?.assinaturaDefault) {
      setPreviewSignature(signature.assinaturaDefault);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <PenTool className="h-5 w-5" />
            Assinatura Digital
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const hasSignature = signature?.assinaturaDefault;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PenTool className="h-5 w-5" />
          Assinatura Digital
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>
            Configure sua assinatura digital para usar nos projetos de monitoria. 
            Você pode desenhar sua assinatura ou fazer upload de uma imagem.
          </AlertDescription>
        </Alert>

        {hasSignature ? (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border rounded-lg bg-green-50">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-600" />
                <div>
                  <p className="font-medium text-green-900">Assinatura configurada</p>
                  <p className="text-sm text-green-700">
                    Salva em: {signature?.dataAssinaturaDefault ? 
                      new Date(signature.dataAssinaturaDefault).toLocaleString('pt-BR') : 
                      'Data não disponível'}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePreviewSignature}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Visualizar
                </Button>
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleDeleteSignature}
                  disabled={deleteSignatureMutation.isPending}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Remover
                </Button>
              </div>
            </div>

            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => setShowSignaturePad(true)}
              >
                <PenTool className="h-4 w-4 mr-2" />
                Alterar Assinatura
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="signature-upload">Upload de Imagem</Label>
                <Input
                  id="signature-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={saveSignatureMutation.isPending}
                />
                <p className="text-xs text-muted-foreground">
                  Formatos aceitos: PNG, JPG, JPEG
                </p>
              </div>
              
              <div className="flex items-center justify-center">
                <div className="text-center space-y-2">
                  <p className="text-sm text-muted-foreground">ou</p>
                  <Button
                    onClick={() => setShowSignaturePad(true)}
                    disabled={saveSignatureMutation.isPending}
                  >
                    <PenTool className="h-4 w-4 mr-2" />
                    Desenhar Assinatura
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showSignaturePad && (
          <div className="space-y-4">
            <ProjectSignaturePad
              onSave={handleSaveSignature}
              isSaving={saveSignatureMutation.isPending}
            />
            <div className="flex justify-center">
              <Button
                variant="outline"
                onClick={() => setShowSignaturePad(false)}
                disabled={saveSignatureMutation.isPending}
              >
                Cancelar
              </Button>
            </div>
          </div>
        )}

        {previewSignature && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Prévia da Assinatura</h3>
              <div className="border rounded-lg p-4 bg-gray-50 flex justify-center">
                <img 
                  src={previewSignature} 
                  alt="Assinatura" 
                  className="max-w-full max-h-32 object-contain"
                />
              </div>
              <div className="flex justify-end mt-4">
                <Button onClick={() => setPreviewSignature(null)}>
                  Fechar
                </Button>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
} 