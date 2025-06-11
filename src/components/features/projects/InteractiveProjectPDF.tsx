import { MonitoriaFormTemplate, MonitoriaFormData } from '@/components/features/projects/MonitoriaFormTemplate';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useSignProject } from '@hooks/use-signature';
import { PDFViewer } from '@react-pdf/renderer';
import { CheckCircle, FileSignature, Loader2 } from 'lucide-react';
import { useRef, useState, useEffect } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { toast } from 'sonner';
import { apiClient } from '@/utils/api-client';

interface InteractiveProjectPDFProps {
  formData: MonitoriaFormData;
  userRole: 'professor' | 'admin';
  onSignatureComplete?: () => void;
}

export function InteractiveProjectPDF({
  formData,
  userRole,
  onSignatureComplete,
}: InteractiveProjectPDFProps) {
  const [showSignatureDialog, setShowSignatureDialog] = useState(false);
  const [signedData, setSignedData] = useState<MonitoriaFormData>(formData);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLoadingSignatures, setIsLoadingSignatures] = useState(true);
  const signatureRef = useRef<SignatureCanvas>(null);
  
  const signProjectMutation = useSignProject();

  // Buscar assinaturas existentes do projeto
  useEffect(() => {
    const loadExistingSignatures = async () => {
      if (!formData.projetoId) {
        setIsLoadingSignatures(false);
        return;
      }

      try {
        const response = await apiClient.get(`/projeto/${formData.projetoId}/pdf-data`);
        const pdfData = response.data;
        
        // Atualizar formData com assinaturas existentes
        setSignedData({
          ...formData,
          assinaturaProfessor: pdfData.assinaturaProfessor,
          dataAssinaturaProfessor: pdfData.dataAssinaturaProfessor,
          assinaturaAdmin: pdfData.assinaturaAdmin,
          dataAssinaturaAdmin: pdfData.dataAssinaturaAdmin,
        });
      } catch (error) {
        console.error('Erro ao carregar assinaturas:', error);
        // Se der erro, continua com os dados originais
      } finally {
        setIsLoadingSignatures(false);
      }
    };

    loadExistingSignatures();
  }, [formData.projetoId]);

  const handleOpenSignature = () => {
    setShowSignatureDialog(true);
  };

  const handleClearSignature = () => {
    if (signatureRef.current) {
      signatureRef.current.clear();
    }
  };

  const handleSaveSignature = async () => {
    if (signatureRef.current && !signatureRef.current.isEmpty() && formData.projetoId) {
      setIsSubmitting(true);
      try {
        const signatureDataURL = signatureRef.current.toDataURL();
        
        if (userRole === 'professor') {
          await signProjectMutation.mutateAsync({
            projetoId: formData.projetoId,
            signatureImage: signatureDataURL,
            tipoAssinatura: 'PROJETO_PROFESSOR_RESPONSAVEL',
          });

          const updatedFormData = {
            ...formData,
            assinaturaProfessor: signatureDataURL,
            dataAssinaturaProfessor: new Date().toLocaleDateString('pt-BR'),
          };
          setSignedData(updatedFormData);
        } else if (userRole === 'admin') {
          await signProjectMutation.mutateAsync({
            projetoId: formData.projetoId,
            signatureImage: signatureDataURL,
            tipoAssinatura: 'PROJETO_COORDENADOR_DEPARTAMENTO',
          });

          const updatedFormData = {
            ...signedData, // Usar signedData que já tem as assinaturas existentes
            assinaturaAdmin: signatureDataURL,
            dataAssinaturaAdmin: new Date().toLocaleDateString('pt-BR'),
            dataAprovacao: new Date().toLocaleDateString('pt-BR'),
          };
          setSignedData(updatedFormData);
        }
        
        setShowSignatureDialog(false);
        toast.success('Assinatura salva com sucesso!');
        onSignatureComplete?.();
      } catch (error) {
        console.error('Erro ao salvar assinatura:', error);
        toast.error('Erro ao salvar assinatura');
      } finally {
        setIsSubmitting(false);
      }
    } else {
      toast.error('Por favor, faça a assinatura antes de salvar');
    }
  };

  const currentFormData = {
    ...signedData,
    signingMode: userRole,
  };
  
  const hasSignature = userRole === 'professor' 
    ? !!currentFormData.assinaturaProfessor 
    : !!currentFormData.assinaturaAdmin;

  const roleLabel = userRole === 'professor' ? 'Professor' : 'Coordenador';

  if (isLoadingSignatures) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex justify-center items-center py-12">
            <Loader2 className="h-8 w-8 animate-spin mr-2" />
            <span>Carregando dados do documento...</span>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <FileSignature className="h-5 w-5" />
              Documento do Projeto - {currentFormData.titulo}
            </span>
            {!hasSignature && (
              <Button onClick={handleOpenSignature} className="ml-4">
                <FileSignature className="h-4 w-4 mr-2" />
                Assinar como {roleLabel}
              </Button>
            )}
            {hasSignature && (
              <div className="flex items-center gap-2 text-green-600">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">Assinado por {roleLabel}</span>
              </div>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg bg-white">
            <PDFViewer width="100%" height="800px" showToolbar>
              <MonitoriaFormTemplate data={currentFormData} />
            </PDFViewer>
          </div>
        </CardContent>
      </Card>

      <Dialog open={showSignatureDialog} onOpenChange={setShowSignatureDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Assinatura Digital - {roleLabel}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="text-sm text-muted-foreground">
              Desenhe sua assinatura no espaço abaixo:
            </div>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 bg-gray-50">
              <SignatureCanvas
                ref={signatureRef}
                canvasProps={{
                  width: 600,
                  height: 200,
                  className: 'signature-canvas bg-white rounded border',
                }}
                backgroundColor="white"
              />
            </div>
            <div className="flex justify-between">
              <Button variant="outline" onClick={handleClearSignature}>
                Limpar
              </Button>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => setShowSignatureDialog(false)}>
                  Cancelar
                </Button>
                <Button onClick={handleSaveSignature} disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : (
                    <>
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Salvar Assinatura
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 