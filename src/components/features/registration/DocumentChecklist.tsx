import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileUploader } from '@/components/ui/FileUploader';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { CheckCircle, Upload, AlertTriangle, FileText, Trash2 } from 'lucide-react';
import { 
  RequiredDocumentType, 
  getRequiredDocuments, 
  getDocumentMetadata, 
  validateRequiredDocuments,
  REQUIRED_DOCUMENTS_BY_TYPE 
} from '@/lib/document-validation';
import { useToast } from '@/hooks/use-toast';

interface UploadedDocument {
  id: string;
  tipoDocumento: RequiredDocumentType;
  fileId: string;
  fileName: string;
  uploadedAt: Date;
}

interface DocumentChecklistProps {
  tipoVaga: keyof typeof REQUIRED_DOCUMENTS_BY_TYPE;
  uploadedDocuments: UploadedDocument[];
  onDocumentUpload: (document: { tipoDocumento: RequiredDocumentType; file: File }) => Promise<void>;
  onDocumentRemove: (documentId: string) => Promise<void>;
  isUploading?: boolean;
  className?: string;
}

export function DocumentChecklist({
  tipoVaga,
  uploadedDocuments,
  onDocumentUpload,
  onDocumentRemove,
  isUploading = false,
  className,
}: DocumentChecklistProps) {
  const { toast } = useToast();
  const [selectedDocumentType, setSelectedDocumentType] = useState<RequiredDocumentType | null>(null);
  const [isUploadDialogOpen, setIsUploadDialogOpen] = useState(false);

  const requiredDocuments = getRequiredDocuments(tipoVaga);
  const uploadedTypes = uploadedDocuments.map(doc => doc.tipoDocumento);
  const validation = validateRequiredDocuments(tipoVaga, uploadedTypes);

  const handleDocumentUpload = async (file: File) => {
    if (!selectedDocumentType) {
      toast({
        title: 'Erro',
        description: 'Selecione o tipo de documento antes de fazer upload',
        variant: 'destructive',
      });
      return;
    }

    try {
      await onDocumentUpload({
        tipoDocumento: selectedDocumentType,
        file,
      });
      
      toast({
        title: 'Sucesso',
        description: 'Documento enviado com sucesso!',
      });
      
      setSelectedDocumentType(null);
      setIsUploadDialogOpen(false);
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao enviar documento. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleRemoveDocument = async (documentId: string) => {
    try {
      await onDocumentRemove(documentId);
      toast({
        title: 'Sucesso',
        description: 'Documento removido com sucesso!',
      });
    } catch (error) {
      toast({
        title: 'Erro',
        description: 'Falha ao remover documento. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const isDocumentUploaded = (documentType: RequiredDocumentType) => {
    return uploadedTypes.includes(documentType);
  };

  const getUploadedDocument = (documentType: RequiredDocumentType) => {
    return uploadedDocuments.find(doc => doc.tipoDocumento === documentType);
  };

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Documentos Obrigatórios
          </CardTitle>
          <CardDescription>
            Para concluir sua inscrição em monitoria ({tipoVaga.toLowerCase()}), você deve enviar todos os documentos listados abaixo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Status geral */}
          <Alert variant={validation.isValid ? "default" : "destructive"}>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              {validation.isValid ? (
                <span className="text-green-600 font-medium">
                  ✅ Todos os documentos obrigatórios foram enviados!
                </span>
              ) : (
                <span>
                  Faltam {validation.missingDocuments.length} documento(s) obrigatório(s) para completar sua inscrição.
                </span>
              )}
            </AlertDescription>
          </Alert>

          {/* Lista de documentos */}
          <div className="space-y-3">
            {requiredDocuments.map((documentType) => {
              const metadata = getDocumentMetadata(documentType);
              const isUploaded = isDocumentUploaded(documentType);
              const uploadedDoc = getUploadedDocument(documentType);

              return (
                <div
                  key={documentType}
                  className={`border rounded-lg p-4 ${
                    isUploaded ? 'border-green-200 bg-green-50' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-medium">{metadata.name}</h4>
                        {isUploaded ? (
                          <Badge variant="secondary" className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Enviado
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-orange-600 border-orange-300">
                            Pendente
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{metadata.description}</p>
                      <div className="text-xs text-gray-500">
                        Formatos aceitos: {metadata.acceptedFormats.map(format => {
                          const extensions = {
                            'application/pdf': 'PDF',
                            'image/jpeg': 'JPEG',
                            'image/png': 'PNG'
                          };
                          return extensions[format] || format;
                        }).join(', ')} | Tamanho máximo: {metadata.maxSizeMB}MB
                      </div>
                      {uploadedDoc && (
                        <div className="text-xs text-gray-500 mt-1">
                          Arquivo: {uploadedDoc.fileName} | Enviado em: {uploadedDoc.uploadedAt.toLocaleDateString()}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2 ml-4">
                      {!isUploaded ? (
                        <Button
                          size="sm"
                          onClick={() => {
                            setSelectedDocumentType(documentType);
                            setIsUploadDialogOpen(true);
                          }}
                          disabled={isUploading}
                        >
                          <Upload className="h-4 w-4 mr-1" />
                          Enviar
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => uploadedDoc && handleRemoveDocument(uploadedDoc.id)}
                          disabled={isUploading}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Remover
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Upload dialog */}
          {isUploadDialogOpen && selectedDocumentType && (
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-sm">
                  Enviar: {getDocumentMetadata(selectedDocumentType).name}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FileUploader
                  onFileSelect={(file) => {
                    if (file) {
                      handleDocumentUpload(file);
                    }
                  }}
                  allowedTypes={[...getDocumentMetadata(selectedDocumentType).acceptedFormats]}
                  maxSizeInMB={getDocumentMetadata(selectedDocumentType).maxSizeMB}
                />
                <div className="flex gap-2 mt-4">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      setIsUploadDialogOpen(false);
                      setSelectedDocumentType(null);
                    }}
                  >
                    Cancelar
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Resumo de progresso */}
          <div className="mt-6 p-3 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span>Progresso dos documentos:</span>
              <span className="font-medium">
                {uploadedTypes.length} / {requiredDocuments.length} documentos enviados
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{
                  width: `${(uploadedTypes.length / requiredDocuments.length) * 100}%`,
                }}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}