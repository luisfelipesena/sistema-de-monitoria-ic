import SignatureCanvas from 'react-signature-canvas';
import { Button } from '@/components/ui/button';
import { useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Signature, ThumbsUp } from 'lucide-react';

interface ProjectSignaturePadProps {
  onSave: (signature: string) => void;
  isSaving?: boolean;
}

export function ProjectSignaturePad({ onSave, isSaving }: ProjectSignaturePadProps) {
  const sigPadRef = useRef<SignatureCanvas>(null);
  const [isSigned, setIsSigned] = useState(false);

  const handleClear = () => {
    sigPadRef.current?.clear();
    setIsSigned(false);
  };

  const handleSave = () => {
    if (sigPadRef.current?.isEmpty()) {
      alert('Por favor, forneça sua assinatura.');
      return;
    }
    const signatureImage = sigPadRef.current?.toDataURL('image/png');
    if (signatureImage) {
      onSave(signatureImage);
    }
  };
  
  const handleBeginStroke = () => {
    setIsSigned(true);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Signature className="h-5 w-5" />
          Assinatura do Professor Responsável
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <ThumbsUp className="h-4 w-4" />
          <AlertTitle>Ação Requerida</AlertTitle>
          <AlertDescription>
            Para submeter o projeto, é necessário que o professor responsável o assine digitalmente. Desenhe sua assinatura no campo abaixo.
          </AlertDescription>
        </Alert>

        <div className="border rounded-md bg-gray-50 p-2">
          <SignatureCanvas
            ref={sigPadRef}
            penColor="black"
            canvasProps={{
              className: 'w-full h-40 rounded-md',
            }}
            onBegin={handleBeginStroke}
          />
        </div>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={handleClear} disabled={isSaving}>
            Limpar
          </Button>
          <Button onClick={handleSave} disabled={isSaving || !isSigned}>
            {isSaving ? 'Salvando...' : 'Salvar Assinatura'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
} 