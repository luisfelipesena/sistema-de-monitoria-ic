import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  CheckCircle, 
  PenTool, 
  Eye,
  X 
} from 'lucide-react';
import { useState } from 'react';
import { ProjectSignaturePad } from './ProjectSignaturePad';

interface SignatureConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  existingSignature?: string;
  signatureDate?: string;
  onConfirmExisting: () => void;
  onSaveNew: (signature: string) => void;
  isSaving?: boolean;
  userRole: 'professor' | 'admin';
}

export function SignatureConfirmationModal({
  isOpen,
  onClose,
  existingSignature,
  signatureDate,
  onConfirmExisting,
  onSaveNew,
  isSaving = false,
  userRole,
}: SignatureConfirmationModalProps) {
  const [showNewSignaturePad, setShowNewSignaturePad] = useState(false);
  const [previewSignature, setPreviewSignature] = useState(false);

  if (!isOpen) return null;

  const roleText = userRole === 'professor' ? 'professor' : 'administrador';

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <Card className="border-0 shadow-none">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <PenTool className="h-5 w-5" />
              Confirmar Assinatura - {roleText}
            </CardTitle>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              disabled={isSaving}
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          
          <CardContent className="space-y-6">
            {existingSignature && !showNewSignaturePad ? (
              <div className="space-y-4">
                <Alert>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    Encontramos uma assinatura configurada no seu perfil. 
                    Você pode usá-la ou criar uma nova para este projeto.
                  </AlertDescription>
                </Alert>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-medium text-green-900">
                        Assinatura do Perfil
                      </h4>
                      <p className="text-sm text-green-700">
                        Salva em: {signatureDate ? 
                          new Date(signatureDate).toLocaleString('pt-BR') : 
                          'Data não disponível'}
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setPreviewSignature(true)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Visualizar
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  <Button
                    onClick={onConfirmExisting}
                    disabled={isSaving}
                    className="flex-1"
                  >
                    {isSaving ? 'Assinando...' : 'Usar Assinatura do Perfil'}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowNewSignaturePad(true)}
                    disabled={isSaving}
                    className="flex-1"
                  >
                    <PenTool className="h-4 w-4 mr-2" />
                    Criar Nova Assinatura
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {!existingSignature && (
                  <Alert>
                    <PenTool className="h-4 w-4" />
                    <AlertDescription>
                      Você não possui uma assinatura configurada no perfil. 
                      Desenhe sua assinatura abaixo para assinar este projeto.
                    </AlertDescription>
                  </Alert>
                )}

                <ProjectSignaturePad
                  onSave={onSaveNew}
                  isSaving={isSaving}
                />

                <div className="flex justify-between">
                  {existingSignature && (
                    <Button
                      variant="outline"
                      onClick={() => setShowNewSignaturePad(false)}
                      disabled={isSaving}
                    >
                      Voltar
                    </Button>
                  )}
                  <div className="flex-1" />
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Modal de prévia da assinatura */}
        {previewSignature && existingSignature && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-60">
            <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold mb-4">Prévia da Assinatura</h3>
              <div className="border rounded-lg p-4 bg-gray-50 flex justify-center">
                <img 
                  src={existingSignature} 
                  alt="Assinatura do perfil" 
                  className="max-w-full max-h-32 object-contain"
                />
              </div>
              <div className="flex justify-end mt-4">
                <Button onClick={() => setPreviewSignature(false)}>
                  Fechar
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
} 