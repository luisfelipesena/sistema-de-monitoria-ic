import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { FileUploader } from '@/components/ui/FileUploader';
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
import { useAuth } from '@/hooks/use-auth';
import { useDepartamentoList } from '@/hooks/use-departamento';
import {
  useCreateDisciplina,
  useDisciplinas,
  useVincularProfessorDisciplina,
} from '@/hooks/use-disciplina';
import { useFileUpload } from '@/hooks/use-files';
import { useSetProfessor } from '@/hooks/use-professor';
import { useToast } from '@/hooks/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from '@tanstack/react-router';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

const professorSchema = z.object({
  nomeCompleto: z.string().min(1, 'Nome completo é obrigatório'),
  nomeSocial: z.string().optional(),
  matriculaSiape: z.string().min(1, 'Matrícula SIAPE é obrigatória'),
  cpf: z.string().min(1, 'CPF é obrigatório'),
  telefone: z.string().optional(),
  telefoneInstitucional: z.string().optional(),
  regime: z.string().min(1, 'Regime é obrigatório'),
  emailInstitucional: z.string().min(1, 'E-mail institucional é obrigatório'),
  departamentoId: z.number().optional(),
  disciplinaIds: z.array(z.number()).optional(),
});

type ProfessorFormData = z.infer<typeof professorSchema>;

export function ProfessorForm() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [useNomeSocial, setUseNomeSocial] = useState(false);
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedDepartamentoId, setSelectedDepartamentoId] = useState<
    number | null
  >(null);
  const [selectedDisciplinas, setSelectedDisciplinas] = useState<number[]>([]);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newDisciplina, setNewDisciplina] = useState({ nome: '', codigo: '' });

  // Buscar departamentos e disciplinas
  const { data: departamentos } = useDepartamentoList();
  const {
    data: disciplinas,
    isLoading: loadingDisciplinas,
    refetch: refetchDisciplinas,
  } = useDisciplinas(
    selectedDepartamentoId ? { departamentoId: selectedDepartamentoId } : {}
  );

  // Arquivos obrigatórios para professor
  const [curriculumVitaeFile, setCurriculumVitaeFile] = useState<File | null>(
    null,
  );
  const [comprovanteVinculoFile, setComprovanteVinculoFile] =
    useState<File | null>(null);

  // Hooks
  const fileUploadMutation = useFileUpload();
  const setProfessorMutation = useSetProfessor();
  const vincularDisciplinaMutation = useVincularProfessorDisciplina();
  const createDisciplinaMutation = useCreateDisciplina();

  const form = useForm<ProfessorFormData>({
    resolver: zodResolver(professorSchema),
    defaultValues: {
      emailInstitucional: user?.email || '',
    },
  });

  const handleCurriculumFileSelect = (file: File | null) => {
    setCurriculumVitaeFile(file);
  };

  const handleComprovanteVinculoFileSelect = (file: File | null) => {
    setComprovanteVinculoFile(file);
  };

  const handleDepartamentoChange = (value: string) => {
    const departamentoId = parseInt(value);
    setSelectedDepartamentoId(departamentoId);
    form.setValue('departamentoId', departamentoId);
    // Resetar disciplinas selecionadas ao mudar de departamento
    setSelectedDisciplinas([]);
    form.setValue('disciplinaIds', []);
  };

  const handleDisciplinaToggle = (disciplinaId: number) => {
    setSelectedDisciplinas((current) => {
      const isSelected = current.includes(disciplinaId);
      const updated = isSelected
        ? current.filter((id) => id !== disciplinaId)
        : [...current, disciplinaId];

      form.setValue('disciplinaIds', updated);
      return updated;
    });
  };

  const handleCreateDisciplina = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDepartamentoId) return;

    createDisciplinaMutation.mutate(
      {
        ...newDisciplina,
        departamentoId: selectedDepartamentoId,
      },
      {
        onSuccess: (created) => {
          toast({ title: 'Disciplina criada com sucesso!' });
          setCreateDialogOpen(false);
          setNewDisciplina({ nome: '', codigo: '' });
          // Auto-seleciona a nova disciplina
          handleDisciplinaToggle(created.id);
          // Refresca a lista de disciplinas
          refetchDisciplinas();
        },
        onError: (error: any) => {
          toast({
            title: 'Erro ao criar disciplina',
            description: error?.response?.data?.error,
            variant: 'destructive',
          });
        },
      }
    );
  };

  const onSubmit = async (values: ProfessorFormData) => {
    if (!curriculumVitaeFile || !comprovanteVinculoFile) {
      toast({
        title: 'Documentos obrigatórios',
        description:
          'É necessário fazer upload do currículo e comprovante de vínculo',
        variant: 'destructive',
      });
      return;
    }

    if (!values.departamentoId) {
      toast({
        title: 'Departamento obrigatório',
        description: 'Por favor, selecione seu departamento',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // 1. Fazer upload dos arquivos e obter os IDs
      let curriculumId: string | null = null;
      let comprovanteId: string | null = null;

      // Upload do currículo (obrigatório)
      try {
        const response = await fileUploadMutation.mutateAsync({
          file: curriculumVitaeFile,
          entityType: 'curriculum_vitae',
          entityId: user?.id?.toString() || '0',
        });
        curriculumId = response.fileId;
      } catch (error: any) {
        toast({
          title: 'Erro no upload do currículo',
          description: error.message || 'Erro ao enviar o currículo vitae',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      // Upload do comprovante de vínculo (obrigatório)
      try {
        const response = await fileUploadMutation.mutateAsync({
          file: comprovanteVinculoFile,
          entityType: 'comprovante_vinculo',
          entityId: user?.id?.toString() || '0',
        });
        comprovanteId = response.fileId;
      } catch (error: any) {
        toast({
          title: 'Erro no upload do comprovante',
          description:
            error.message || 'Erro ao enviar o comprovante de vínculo',
          variant: 'destructive',
        });
        setIsSubmitting(false);
        return;
      }

      // 2. Enviar os dados do professor com os IDs dos arquivos
      if (!useNomeSocial) {
        values.nomeSocial = undefined;
      }

      const tipoRegime = values.regime as '20H' | '40H' | 'DE';

      // Salvar professor
      const professorResponse = await setProfessorMutation.mutateAsync({
        nomeCompleto: values.nomeCompleto,
        cpf: values.cpf,
        matriculaSiape: values.matriculaSiape,
        nomeSocial: values.nomeSocial,
        telefone: values.telefone,
        telefoneInstitucional: values.telefoneInstitucional,
        emailInstitucional: values.emailInstitucional,
        genero: 'OUTRO',
        regime: tipoRegime,
        departamentoId: values.departamentoId!,
        curriculumVitaeFileId: curriculumId!,
        comprovanteVinculoFileId: comprovanteId!,
      });

      // 3. Se selecionou disciplinas, vincular professor a elas
      const disciplinaIds = values.disciplinaIds || [];
      if (professorResponse.id && disciplinaIds.length > 0) {
        const ano = new Date().getFullYear();
        const semestre =
          new Date().getMonth() <= 6 ? 'SEMESTRE_1' : 'SEMESTRE_2';

        // Vincular cada disciplina selecionada
        for (const disciplinaId of disciplinaIds) {
          try {
            await vincularDisciplinaMutation.mutateAsync({
              disciplinaId,
              professorId: professorResponse.id,
              ano,
              semestre: semestre as 'SEMESTRE_1' | 'SEMESTRE_2',
            });
          } catch (error: any) {
            console.error(
              `Erro ao vincular disciplina ${disciplinaId}:`,
              error,
            );
            // Continuar mesmo se falhar uma disciplina
          }
        }
      }

      toast({
        title: 'Cadastro realizado com sucesso!',
      });

      navigate({ to: '/home' });
    } catch (error: any) {
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Ocorreu um erro ao salvar os dados',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Informações Pessoais</h2>

        <div className="grid grid-cols-1 gap-4">
          <div>
            <Label htmlFor="nomeCompleto">Nome Completo</Label>
            <Input
              id="nomeCompleto"
              {...form.register('nomeCompleto')}
              className={
                form.formState.errors.nomeCompleto ? 'border-red-500' : ''
              }
            />
            {form.formState.errors.nomeCompleto && (
              <p className="text-red-500 text-sm mt-1">
                {form.formState.errors.nomeCompleto.message}
              </p>
            )}
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="useNomeSocial"
              checked={useNomeSocial}
              onCheckedChange={(checked) => setUseNomeSocial(checked === true)}
            />
            <Label htmlFor="useNomeSocial" className="text-sm font-normal">
              Usar nome social
            </Label>
          </div>

          {useNomeSocial && (
            <div className="ml-6">
              <Label htmlFor="nomeSocial">Nome Social</Label>
              <Input id="nomeSocial" {...form.register('nomeSocial')} />
            </div>
          )}

          <div>
            <Label htmlFor="emailInstitucional">E-mail Institucional</Label>
            <Input
              id="emailInstitucional"
              {...form.register('emailInstitucional')}
              disabled
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Documentos e Identificação</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="matriculaSiape">Matrícula SIAPE</Label>
            <Input
              id="matriculaSiape"
              {...form.register('matriculaSiape')}
              className={
                form.formState.errors.matriculaSiape ? 'border-red-500' : ''
              }
            />
            {form.formState.errors.matriculaSiape && (
              <p className="text-red-500 text-sm mt-1">
                {form.formState.errors.matriculaSiape.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="cpf">CPF</Label>
            <Input
              id="cpf"
              {...form.register('cpf')}
              className={form.formState.errors.cpf ? 'border-red-500' : ''}
              placeholder="Somente números"
            />
            {form.formState.errors.cpf && (
              <p className="text-red-500 text-sm mt-1">
                {form.formState.errors.cpf.message}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="telefone">Telefone Pessoal</Label>
            <Input
              id="telefone"
              {...form.register('telefone')}
              placeholder="(xx) xxxxx-xxxx"
            />
          </div>

          <div>
            <Label htmlFor="telefoneInstitucional">Telefone Institucional</Label>
            <Input
              id="telefoneInstitucional"
              {...form.register('telefoneInstitucional')}
              placeholder="(xx) xxxx-xxxx"
            />
          </div>
        </div>
      </div>

      <div className="space-y-2">
        <h2 className="text-xl font-semibold">Regime de Trabalho</h2>

        <div>
          <Label htmlFor="regime">Regime</Label>
          <Select
            onValueChange={(value) => form.setValue('regime', value)}
            defaultValue={form.getValues('regime')}
          >
            <SelectTrigger
              className={form.formState.errors.regime ? 'border-red-500' : ''}
            >
              <SelectValue placeholder="Selecione o regime" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="20H">20 horas</SelectItem>
              <SelectItem value="40H">40 horas</SelectItem>
              <SelectItem value="DE">Dedicação Exclusiva</SelectItem>
            </SelectContent>
          </Select>
          {form.formState.errors.regime && (
            <p className="text-red-500 text-sm mt-1">
              {form.formState.errors.regime.message}
            </p>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Departamento e Disciplinas</h2>
        <div>
          <Label htmlFor="departamento">Departamento</Label>
          <Select onValueChange={handleDepartamentoChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione seu departamento" />
            </SelectTrigger>
            <SelectContent>
              {departamentos?.map((dept) => (
                <SelectItem key={dept.id} value={dept.id.toString()}>
                  {dept.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedDepartamentoId && (
          <div>
            <Label>Disciplinas que você leciona</Label>
            <div className="mt-2 border rounded-md p-4 space-y-2 max-h-64 overflow-y-auto">
              {loadingDisciplinas ? (
                <div className="flex justify-center py-4">
                  <Spinner />
                </div>
              ) : disciplinas?.length ? (
                disciplinas.map((disciplina) => (
                  <div
                    key={disciplina.id}
                    className="flex items-start space-x-2"
                  >
                    <Checkbox
                      id={`disciplina-${disciplina.id}`}
                      checked={selectedDisciplinas.includes(disciplina.id)}
                      onCheckedChange={() =>
                        handleDisciplinaToggle(disciplina.id)
                      }
                    />
                    <Label
                      htmlFor={`disciplina-${disciplina.id}`}
                      className="text-sm font-normal cursor-pointer"
                    >
                      <span className="font-medium">{disciplina.codigo}</span> -{' '}
                      {disciplina.nome}
                    </Label>
                  </div>
                ))
              ) : (
                <p className="text-muted-foreground text-sm italic">
                  Nenhuma disciplina encontrada para este departamento
                </p>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Selecione as disciplinas que você leciona neste semestre
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Não encontrou a disciplina?{' '}
              <Button
                type="button"
                variant="ghost"
                className="p-0 h-auto"
                onClick={() => setCreateDialogOpen(true)}
              >
                Cadastre uma nova.
              </Button>
            </p>
          </div>
        )}
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-semibold">Documentos Obrigatórios</h2>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div>
            <Label htmlFor="curriculum">
              Currículo Vitae <span className="text-red-500">*</span>
            </Label>
            <div className="mt-2">
              <div className="border border-dashed border-gray-300 p-4 rounded-md">
                <FileUploader
                  onFileSelect={handleCurriculumFileSelect}
                  selectedFile={curriculumVitaeFile}
                  allowedTypes={['application/pdf']}
                  maxSizeInMB={100}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                <span className="font-semibold">Documento obrigatório</span>{' '}
                (PDF, máx. 100MB)
              </p>
              {curriculumVitaeFile && (
                <p className="text-xs text-green-600 mt-1">
                  Arquivo selecionado com sucesso!
                </p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="comprovante">
              Comprovante de Vínculo <span className="text-red-500">*</span>
            </Label>
            <div className="mt-2">
              <div className="border border-dashed border-gray-300 p-4 rounded-md">
                <FileUploader
                  onFileSelect={handleComprovanteVinculoFileSelect}
                  selectedFile={comprovanteVinculoFile}
                  allowedTypes={['application/pdf']}
                  maxSizeInMB={100}
                />
              </div>
              <p className="text-sm text-muted-foreground mt-1">
                <span className="font-semibold">Documento obrigatório</span>{' '}
                (PDF, máx. 100MB)
              </p>
              {comprovanteVinculoFile && (
                <p className="text-xs text-green-600 mt-1">
                  Arquivo selecionado com sucesso!
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="pt-4">
        <Button type="submit" className="w-full" disabled={isSubmitting}>
          {isSubmitting ? (
            <span className="flex items-center gap-2">
              <Spinner /> Salvando...
            </span>
          ) : (
            'Concluir Cadastro'
          )}
        </Button>
        <p className="text-xs text-center text-muted-foreground mt-2">
          Ao clicar em Concluir Cadastro, seus arquivos serão enviados
          automaticamente.
        </p>
      </div>
      {setProfessorMutation.error && (
        <p className="text-red-500 text-sm mt-2 text-center">
          Erro ao salvar: {setProfessorMutation.error.message}
        </p>
      )}

      {/* Create Disciplina Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cadastrar Nova Disciplina</DialogTitle>
            <DialogDescription>
              Preencha os dados da nova disciplina. Ela será associada ao
              departamento selecionado.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={handleCreateDisciplina}
            className="space-y-4 py-4"
          >
            <div className="space-y-2">
              <Label htmlFor="codigo-create">Código da Disciplina</Label>
              <Input
                id="codigo-create"
                value={newDisciplina.codigo}
                onChange={(e) =>
                  setNewDisciplina({ ...newDisciplina, codigo: e.target.value })
                }
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nome-create">Nome da Disciplina</Label>
              <Input
                id="nome-create"
                value={newDisciplina.nome}
                onChange={(e) =>
                  setNewDisciplina({ ...newDisciplina, nome: e.target.value })
                }
                required
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={createDisciplinaMutation.isPending}
              >
                {createDisciplinaMutation.isPending
                  ? 'Criando...'
                  : 'Criar e Selecionar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </form>
  );
}
