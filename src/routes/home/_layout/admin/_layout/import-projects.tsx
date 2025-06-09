import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useProjectImport } from '@/hooks/use-import-planejamento';
import { zodResolver } from '@hookform/resolvers/zod';
import { createFileRoute } from '@tanstack/react-router';
import { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

export const Route = createFileRoute('/home/_layout/admin/_layout/import-projects')({
  component: ImportProjectsComponent,
});

const importSchema = z.object({
  ano: z.string().min(4, 'Ano é obrigatório'),
  semestre: z.enum(['SEMESTRE_1', 'SEMESTRE_2'], {
    errorMap: () => ({ message: 'Semestre é obrigatório' }),
  }),
});

type ImportForm = z.infer<typeof importSchema>;

function ImportProjectsComponent() {
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);

  const importMutation = useProjectImport();

  const form = useForm<ImportForm>({
    resolver: zodResolver(importSchema),
    defaultValues: {
      ano: new Date().getFullYear().toString(),
    },
  });

  const onDrop = useCallback((acceptedFiles: File[], fileRejections: any[]) => {
    setFileError(null);
    if (fileRejections.length > 0) {
      setFileError('Arquivo inválido. Apenas .xlsx é permitido.');
      setFile(null);
    } else if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
    },
    maxFiles: 1,
  });

  const onSubmit = (data: ImportForm) => {
    if (!file) {
      setFileError('Por favor, selecione um arquivo.');
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const base64File = reader.result as string;
      toast.promise(
        importMutation.mutateAsync({
          ...data,
          file: base64File,
        }),
        {
          loading: 'Importando projetos...',
          success: (result) => {
            let successMessage = result.message;
            if (result.errors && result.errors.length > 0) {
              successMessage += ` Erros: ${result.errors.join(', ')}`;
            }
            return successMessage;
          },
          error: (err) => `Falha na importação: ${err.message}`,
        },
      );
    };
    reader.onerror = () => {
      toast.error('Falha ao ler o arquivo.');
    };
  };

  return (
    <div className="p-4">
      <Card>
        <CardHeader>
          <CardTitle>Importar Planejamento de Projetos</CardTitle>
          <CardDescription>
            Faça o upload de uma planilha .xlsx para criar múltiplos projetos de
            monitoria de uma vez.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ano">Ano</Label>
                <Input
                  id="ano"
                  type="number"
                  {...form.register('ano')}
                  placeholder="Ex: 2024"
                />
                {form.formState.errors.ano && (
                  <p className="text-red-500 text-sm">{form.formState.errors.ano.message}</p>
                )}
              </div>
              <div>
                <Label htmlFor="semestre">Semestre</Label>
                <Select onValueChange={(value) => form.setValue('semestre', value as any)} defaultValue={form.getValues('semestre')}>
                  <SelectTrigger id="semestre">
                    <SelectValue placeholder="Selecione o semestre" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SEMESTRE_1">1º Semestre</SelectItem>
                    <SelectItem value="SEMESTRE_2">2º Semestre</SelectItem>
                  </SelectContent>
                </Select>
                 {form.formState.errors.semestre && (
                  <p className="text-red-500 text-sm">{form.formState.errors.semestre.message}</p>
                )}
              </div>
            </div>

            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
                ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}`}
            >
              <input {...getInputProps()} />
              {isDragActive ? (
                <p>Solte o arquivo aqui ...</p>
              ) : (
                <p>Arraste e solte o arquivo .xlsx aqui, ou clique para selecionar</p>
              )}
            </div>

            {file && (
              <div className="text-center font-medium">
                Arquivo selecionado: {file.name}
              </div>
            )}
            {fileError && <p className="text-red-500 text-sm text-center">{fileError}</p>}

            <Button type="submit" disabled={importMutation.isPending} className="w-full">
              {importMutation.isPending ? 'Importando...' : 'Iniciar Importação'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 