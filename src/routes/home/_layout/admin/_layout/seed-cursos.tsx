import { PagesLayout } from '@/components/layout/PagesLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useCreateCurso } from '@/hooks/use-curso';
import { useToast } from '@/hooks/use-toast';
import { createFileRoute, useNavigate } from '@tanstack/react-router';
import {
  ChevronLeft,
  Database,
  Info,
  Loader2,
  Plus,
  Save,
  Upload,
} from 'lucide-react';
import { useState } from 'react';
import { z } from 'zod';

export const Route = createFileRoute('/home/_layout/admin/_layout/seed-cursos')(
  {
    component: SeedCursosPage,
  },
);

const cursoSchema = z.object({
  nome: z.string().min(1, 'Nome é obrigatório'),
  codigo: z.coerce.number().nullable(),
});

type CursoInput = z.infer<typeof cursoSchema>;

function SeedCursosPage() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [cursos, setCursos] = useState<CursoInput[]>([]);
  const [bulkInput, setBulkInput] = useState<string>('');
  const [currentNome, setCurrentNome] = useState<string>('');
  const [currentCodigo, setCurrentCodigo] = useState<string>('');
  const [processing, setProcessing] = useState(false);

  // Hook para criar cursos
  const createCursoMutation = useCreateCurso();

  const handleAddCurso = () => {
    try {
      // Validar os dados
      const validatedData = cursoSchema.parse({
        nome: currentNome.trim(),
        codigo: currentCodigo ? parseInt(currentCodigo) : null,
      });

      // Adicionar à lista
      setCursos((prev) => [...prev, validatedData]);

      // Limpar campos
      setCurrentNome('');
      setCurrentCodigo('');
    } catch (error) {
      if (error instanceof z.ZodError) {
        const errorMessage = error.errors
          .map((err) => `${err.path}: ${err.message}`)
          .join(', ');
        toast({
          title: 'Erro na validação',
          description: errorMessage,
          variant: 'destructive',
        });
      }
    }
  };

  const handleRemoveCurso = (index: number) => {
    setCursos((prev) => prev.filter((_, i) => i !== index));
  };

  const handleParseBulkInput = () => {
    try {
      // Tentar interpretar como JSON
      try {
        const jsonData = JSON.parse(bulkInput);
        if (Array.isArray(jsonData)) {
          const validatedData = jsonData.map((item) =>
            cursoSchema.parse({
              nome: item.nome || '',
              codigo: item.codigo || null,
            }),
          );
          setCursos(validatedData);
          toast({
            title: 'Dados importados com sucesso',
            description: `${validatedData.length} cursos foram importados.`,
          });
          return;
        }
      } catch {}

      // Se não for JSON válido, tentar CSV/texto por linha
      const lines = bulkInput.split('\n').filter((line) => line.trim());
      const parsedCursos: CursoInput[] = [];

      for (const line of lines) {
        const parts = line.split(',');
        if (parts.length >= 1) {
          const nome = parts[0].trim();
          const codigo = parts.length > 1 ? parseInt(parts[1].trim()) : null;

          if (nome) {
            parsedCursos.push({
              nome,
              codigo: isNaN(codigo as number) ? null : codigo,
            });
          }
        }
      }

      if (parsedCursos.length > 0) {
        setCursos(parsedCursos);
        toast({
          title: 'Dados importados com sucesso',
          description: `${parsedCursos.length} cursos foram importados.`,
        });
      } else {
        toast({
          title: 'Nenhum dado válido encontrado',
          description: 'Verifique o formato e tente novamente.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro ao processar dados',
        description: 'O formato dos dados é inválido.',
        variant: 'destructive',
      });
    }
  };

  const handleCreateAll = async () => {
    if (cursos.length === 0) {
      toast({
        title: 'Nenhum curso para criar',
        description: 'Adicione pelo menos um curso à lista.',
        variant: 'destructive',
      });
      return;
    }

    setProcessing(true);
    const results = { success: 0, failed: 0 };

    try {
      // Criar cursos sequencialmente para evitar sobrecarga
      for (const curso of cursos) {
        try {
          await createCursoMutation.mutateAsync(curso);
          results.success++;
        } catch (error) {
          results.failed++;
        }
      }

      // Mostrar resultado
      if (results.success > 0) {
        toast({
          title: 'Cursos criados com sucesso',
          description: `${results.success} curso(s) criado(s) com sucesso${results.failed > 0 ? ` (${results.failed} falha(s))` : ''}.`,
        });

        if (results.failed === 0) {
          // Limpar a lista se tudo foi bem-sucedido
          setCursos([]);
        }
      } else {
        toast({
          title: 'Falha ao criar cursos',
          description:
            'Nenhum curso foi criado. Verifique os dados e tente novamente.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Erro no processamento',
        description: 'Ocorreu um erro ao criar os cursos.',
        variant: 'destructive',
      });
    } finally {
      setProcessing(false);
    }
  };

  const backButton = (
    <Button
      variant="secondary"
      onClick={() => navigate({ to: '/home/admin/cursos' })}
    >
      <ChevronLeft size={16} className="mr-2" />
      Voltar para gerenciamento de cursos
    </Button>
  );

  return (
    <PagesLayout
      title="Criação em Massa de Cursos"
      subtitle="Use esta ferramenta para adicionar múltiplos cursos de uma só vez"
      actions={backButton}
    >
      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-6">
          <div className="bg-muted/30 border rounded-md p-4">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Database size={18} className="mr-2" />
              Dados em Massa
            </h2>

            <div className="space-y-4">
              <div>
                <Label htmlFor="bulkInput">
                  Cole dados CSV, JSON ou texto simples
                </Label>
                <Textarea
                  id="bulkInput"
                  placeholder="Nome do Curso 1, 123&#10;Nome do Curso 2, 456&#10;..."
                  className="h-40 font-mono text-sm"
                  value={bulkInput}
                  onChange={(e) => setBulkInput(e.target.value)}
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Formatos aceitos: JSON array, CSV, ou uma linha por curso com
                  nome e código separados por vírgula
                </p>
              </div>

              <Button onClick={handleParseBulkInput} className="w-full">
                <Upload size={16} className="mr-2" />
                Processar Dados
              </Button>
            </div>
          </div>

          <div className="bg-muted/30 border rounded-md p-4">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Plus size={18} className="mr-2" />
              Adicionar Manualmente
            </h2>

            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="nome">Nome do Curso</Label>
                <Input
                  id="nome"
                  value={currentNome}
                  onChange={(e) => setCurrentNome(e.target.value)}
                  placeholder="Ex: Ciência da Computação"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="codigo">Código do Curso (opcional)</Label>
                <Input
                  id="codigo"
                  type="number"
                  value={currentCodigo}
                  onChange={(e) => setCurrentCodigo(e.target.value)}
                  placeholder="Ex: 112"
                />
              </div>

              <Button
                onClick={handleAddCurso}
                variant="secondary"
                className="w-full"
              >
                <Plus size={16} className="mr-2" />
                Adicionar à Lista
              </Button>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="bg-muted/30 border rounded-md p-4 flex-1">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold flex items-center">
                <Save size={18} className="mr-2" />
                Cursos a Criar
              </h2>
              <span className="text-sm text-muted-foreground">
                {cursos.length} curso(s)
              </span>
            </div>

            {cursos.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <Info className="mx-auto h-8 w-8 mb-2 opacity-50" />
                <p>Nenhum curso na lista.</p>
                <p className="text-sm">
                  Adicione cursos manualmente ou importe em massa.
                </p>
              </div>
            ) : (
              <div className="h-[400px] overflow-y-auto pr-2">
                <table className="w-full text-sm">
                  <thead className="text-left bg-muted/50">
                    <tr>
                      <th className="p-2 font-medium">Nome</th>
                      <th className="p-2 font-medium">Código</th>
                      <th className="p-2 w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {cursos.map((curso, index) => (
                      <tr key={index} className="border-b border-muted">
                        <td className="p-2">{curso.nome}</td>
                        <td className="p-2">{curso.codigo || '-'}</td>
                        <td className="p-2">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => handleRemoveCurso(index)}
                            className="h-7 w-7 p-0"
                          >
                            &times;
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            <div className="mt-4 pt-4 border-t">
              <Button
                onClick={handleCreateAll}
                disabled={cursos.length === 0 || processing}
                className="w-full"
              >
                {processing ? (
                  <>
                    <Loader2 size={16} className="mr-2 animate-spin" />
                    Processando...
                  </>
                ) : (
                  <>
                    <Save size={16} className="mr-2" />
                    Criar {cursos.length} Curso(s)
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </PagesLayout>
  );
}
