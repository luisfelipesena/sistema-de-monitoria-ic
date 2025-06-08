import { PagesLayout } from '@/components/layout/PagesLayout';
import { TableComponent } from '@/components/layout/TableComponent';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDepartamentoList } from '@/hooks/use-departamento';
import {
  useDisciplinas,
  useVincularProfessorDisciplina,
} from '@/hooks/use-disciplina';
import { useSetProfessor } from '@/hooks/use-professor';
import { useUpdateUserRole, useUsers } from '@/hooks/use-user';
import { createFileRoute } from '@tanstack/react-router';
import { ColumnDef } from '@tanstack/react-table';
import { Loader, Mail, Pencil, Plus, User, Users } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export const Route = createFileRoute('/home/_layout/admin/_layout/professores')(
  {
    component: ProfessoresPage,
  },
);

interface ProfessorFormData {
  userId: number;
  departamentoId: number;
  nomeCompleto: string;
  emailInstitucional: string;
  matriculaSiape: string;
  genero: 'MASCULINO' | 'FEMININO' | 'OUTRO';
  regime: '20H' | '40H' | 'DE';
  cpf: string;
  telefone?: string;
}

function ProfessoresPage() {
  const { data: users, isLoading: loadingUsers } = useUsers();
  const { data: departamentos } = useDepartamentoList();
  const updateUserRoleMutation = useUpdateUserRole();
  const setProfessorMutation = useSetProfessor();

  // Professores section
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingProfessorId, setEditingProfessorId] = useState<number | null>(
    null,
  );
  const [formData, setFormData] = useState<Partial<ProfessorFormData>>({});
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  // Disciplinas section
  const [selectedDepartamentoId, setSelectedDepartamentoId] = useState<
    number | null
  >(null);
  const { data: disciplinas, isLoading: loadingDisciplinas } = useDisciplinas(
    selectedDepartamentoId || undefined,
  );
  const [isVinculoModalOpen, setIsVinculoModalOpen] = useState(false);
  const [selectedDisciplina, setSelectedDisciplina] = useState<any | null>(
    null,
  );
  const [selectedProfessorId, setSelectedProfessorId] = useState<number | null>(
    null,
  );
  const vincularProfessorMutation = useVincularProfessorDisciplina();

  const professores = users?.filter((user) => user.role === 'professor') || [];
  const availableUsers = users?.filter((user) => user.role === 'student') || [];

  const handleCreateProfessor = async () => {
    if (
      !selectedUserId ||
      !formData.departamentoId ||
      !formData.nomeCompleto ||
      !formData.emailInstitucional ||
      !formData.cpf ||
      !formData.genero ||
      !formData.regime
    ) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      if (!isEditMode) {
        await updateUserRoleMutation.mutateAsync({
          userId: selectedUserId,
          data: { role: 'professor' },
        });
      }

      await setProfessorMutation.mutateAsync({
        departamentoId: formData.departamentoId,
        nomeCompleto: formData.nomeCompleto,
        emailInstitucional: formData.emailInstitucional,
        matriculaSiape: formData.matriculaSiape || '',
        genero: formData.genero,
        regime: formData.regime,
        cpf: formData.cpf,
        telefone: formData.telefone,
        nomeSocial: undefined,
        especificacaoGenero: undefined,
        telefoneInstitucional: undefined,
      });

      toast.success(
        isEditMode
          ? 'Professor atualizado com sucesso!'
          : 'Professor criado com sucesso!',
      );
      setIsModalOpen(false);
      setFormData({});
      setSelectedUserId(null);
      setIsEditMode(false);
      setEditingProfessorId(null);
    } catch (error) {
      toast.error(
        isEditMode ? 'Erro ao atualizar professor' : 'Erro ao criar professor',
      );
    }
  };

  const handleEditProfessor = (professorId: number) => {
    const professor = professores.find((p) => p.id === professorId);
    if (professor) {
      setIsEditMode(true);
      setEditingProfessorId(professorId);
      setSelectedUserId(professor.id);
      setFormData({
        userId: professor.id,
        nomeCompleto: professor.username,
        emailInstitucional: professor.email,
        departamentoId: undefined,
        matriculaSiape: '',
        genero: 'MASCULINO',
        regime: 'DE',
        cpf: '',
      });
      setIsModalOpen(true);
    }
  };

  const handleOpenVinculoModal = (disciplina: any) => {
    setSelectedDisciplina(disciplina);
    setSelectedProfessorId(disciplina.professorResponsavelId || null);
    setIsVinculoModalOpen(true);
  };

  const handleSaveVinculo = async () => {
    if (!selectedDisciplina || !selectedProfessorId) {
      toast.error('Selecione um professor para vincular à disciplina');
      return;
    }

    try {
      // Obter o ano e semestre atual
      const hoje = new Date();
      const ano = hoje.getFullYear();
      const semestre = hoje.getMonth() <= 6 ? 'SEMESTRE_1' : 'SEMESTRE_2';

      await vincularProfessorMutation.mutateAsync({
        disciplinaId: selectedDisciplina.id,
        professorId: selectedProfessorId,
        ano,
        semestre,
      });

      toast.success('Professor vinculado à disciplina com sucesso!');
      setIsVinculoModalOpen(false);
    } catch (error) {
      toast.error('Erro ao vincular professor à disciplina');
    }
  };

  const columns: ColumnDef<any>[] = [
    {
      header: () => (
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-gray-400" />
          Nome
        </div>
      ),
      accessorKey: 'username',
      cell: ({ row }) => (
        <span className="font-semibold text-base text-gray-900">
          {row.original.username}
        </span>
      ),
    },
    {
      header: () => (
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-gray-400" />
          Email
        </div>
      ),
      accessorKey: 'email',
    },
    {
      header: () => (
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-gray-400" />
          Status
        </div>
      ),
      accessorKey: 'role',
      cell: ({ row }) => <Badge variant="success">Professor</Badge>,
    },
    {
      header: 'Ações',
      accessorKey: 'acoes',
      cell: ({ row }) => (
        <Button
          variant="secondary"
          size="sm"
          className="rounded-full flex items-center gap-1"
          onClick={() => handleEditProfessor(row.original.id)}
        >
          <Pencil className="h-4 w-4" />
          Editar
        </Button>
      ),
    },
  ];

  const disciplinasColumns: ColumnDef<any>[] = [
    {
      header: 'Código',
      accessorKey: 'codigo',
      cell: ({ row }) => (
        <span className="font-medium">{row.original.codigo}</span>
      ),
    },
    {
      header: 'Nome',
      accessorKey: 'nome',
    },
    {
      header: 'Professor Responsável',
      accessorKey: 'professorResponsavel',
      cell: ({ row }) => (
        <span>
          {row.original.professorResponsavel || (
            <span className="text-gray-400 italic">Não definido</span>
          )}
        </span>
      ),
    },
    {
      header: 'Ações',
      accessorKey: 'acoes',
      cell: ({ row }) => (
        <Button
          variant="secondary"
          size="sm"
          className="rounded-full flex items-center gap-1"
          onClick={() => handleOpenVinculoModal(row.original)}
        >
          <Pencil className="h-4 w-4" />
          Vincular Professor
        </Button>
      ),
    },
  ];

  const addProfessorButton = (
    <Button
      variant="primary"
      className="bg-[#1B2A50] text-white hover:bg-[#24376c] transition-colors"
      onClick={() => {
        setIsEditMode(false);
        setEditingProfessorId(null);
        setFormData({});
        setSelectedUserId(null);
        setIsModalOpen(true);
      }}
    >
      <Plus className="w-4 h-4 mr-2" />
      Adicionar Professor
    </Button>
  );

  return (
    <PagesLayout title="Gerenciar Professores" actions={addProfessorButton}>
      <Tabs defaultValue="professores" className="space-y-4">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="professores">Professores</TabsTrigger>
          <TabsTrigger value="disciplinas">
            Disciplinas e Professores
          </TabsTrigger>
        </TabsList>

        <TabsContent value="professores">
          {loadingUsers ? (
            <div className="flex justify-center items-center py-8">
              <Loader className="h-8 w-8 animate-spin" />
              <span className="ml-2">Carregando professores...</span>
            </div>
          ) : (
            <TableComponent columns={columns} data={professores} />
          )}
        </TabsContent>

        <TabsContent value="disciplinas">
          <div className="space-y-4">
            <div>
              <Label>Selecione o Departamento</Label>
              <Select
                value={selectedDepartamentoId?.toString() || ''}
                onValueChange={(value) =>
                  setSelectedDepartamentoId(parseInt(value))
                }
              >
                <SelectTrigger className="w-full max-w-xs">
                  <SelectValue placeholder="Selecione um departamento" />
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

            {selectedDepartamentoId ? (
              loadingDisciplinas ? (
                <div className="flex justify-center items-center py-8">
                  <Loader className="h-8 w-8 animate-spin" />
                  <span className="ml-2">Carregando disciplinas...</span>
                </div>
              ) : disciplinas && disciplinas.length > 0 ? (
                <TableComponent
                  columns={disciplinasColumns}
                  data={disciplinas}
                />
              ) : (
                <div className="text-center py-8 border rounded">
                  <p className="text-gray-500">
                    Nenhuma disciplina encontrada para este departamento.
                  </p>
                </div>
              )
            ) : (
              <div className="text-center py-8 border rounded">
                <p className="text-gray-500">
                  Selecione um departamento para ver as disciplinas.
                </p>
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Modal para adicionar/editar professor */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditMode ? 'Editar Professor' : 'Adicionar Professor'}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {!isEditMode && (
              <div>
                <Label>Selecionar Usuário</Label>
                <Select
                  value={selectedUserId?.toString() || ''}
                  onValueChange={(value) => setSelectedUserId(parseInt(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione um usuário" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableUsers.map((user) => (
                      <SelectItem key={user.id} value={user.id.toString()}>
                        {user.username} ({user.email})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div>
              <Label>Departamento *</Label>
              <Select
                value={formData.departamentoId?.toString() || ''}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    departamentoId: parseInt(value),
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o departamento" />
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

            <div>
              <Label>Nome Completo *</Label>
              <Input
                value={formData.nomeCompleto || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    nomeCompleto: e.target.value,
                  }))
                }
                placeholder="Nome completo do professor"
              />
            </div>

            <div>
              <Label>Email Institucional *</Label>
              <Input
                value={formData.emailInstitucional || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    emailInstitucional: e.target.value,
                  }))
                }
                placeholder="Email institucional"
              />
            </div>

            <div>
              <Label>CPF *</Label>
              <Input
                value={formData.cpf || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, cpf: e.target.value }))
                }
                placeholder="CPF do professor"
              />
            </div>

            <div>
              <Label>Gênero *</Label>
              <Select
                value={formData.genero || ''}
                onValueChange={(value: 'MASCULINO' | 'FEMININO' | 'OUTRO') =>
                  setFormData((prev) => ({ ...prev, genero: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o gênero" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="MASCULINO">Masculino</SelectItem>
                  <SelectItem value="FEMININO">Feminino</SelectItem>
                  <SelectItem value="OUTRO">Outro</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Regime *</Label>
              <Select
                value={formData.regime || ''}
                onValueChange={(value: '20H' | '40H' | 'DE') =>
                  setFormData((prev) => ({ ...prev, regime: value }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o regime" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="20H">20H</SelectItem>
                  <SelectItem value="40H">40H</SelectItem>
                  <SelectItem value="DE">DE</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>SIAPE</Label>
              <Input
                value={formData.matriculaSiape || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    matriculaSiape: e.target.value,
                  }))
                }
                placeholder="Matrícula SIAPE"
              />
            </div>

            <div>
              <Label>Telefone</Label>
              <Input
                value={formData.telefone || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    telefone: e.target.value,
                  }))
                }
                placeholder="Telefone do professor"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateProfessor}>
              {isEditMode ? 'Atualizar Professor' : 'Criar Professor'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal para vincular professor à disciplina */}
      <Dialog open={isVinculoModalOpen} onOpenChange={setIsVinculoModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Vincular Professor à Disciplina</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {selectedDisciplina && (
              <div>
                <p className="text-sm font-medium mb-4">
                  Disciplina:{' '}
                  <span className="font-bold">{selectedDisciplina.codigo}</span>{' '}
                  - {selectedDisciplina.nome}
                </p>

                <Label>Professor Responsável</Label>
                <Select
                  value={selectedProfessorId?.toString() || ''}
                  onValueChange={(value) =>
                    setSelectedProfessorId(parseInt(value))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o professor responsável" />
                  </SelectTrigger>
                  <SelectContent>
                    {professores?.map((prof) => (
                      <SelectItem key={prof.id} value={prof.id.toString()}>
                        {prof.username}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <p className="text-xs text-gray-500 mt-2">
                  Este professor será definido como responsável pela disciplina
                  no semestre atual.
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsVinculoModalOpen(false)}
            >
              Cancelar
            </Button>
            <Button onClick={handleSaveVinculo}>Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PagesLayout>
  );
}
