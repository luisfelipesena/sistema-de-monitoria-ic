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
import { useDepartamentoList } from '@/hooks/use-departamento';
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

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingProfessorId, setEditingProfessorId] = useState<number | null>(
    null,
  );
  const [formData, setFormData] = useState<Partial<ProfessorFormData>>({});
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

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

  const actions = (
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
    <PagesLayout title="Gerenciar Professores" actions={actions}>
      {loadingUsers ? (
        <div className="flex justify-center items-center py-8">
          <Loader className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando professores...</span>
        </div>
      ) : (
        <TableComponent columns={columns} data={professores} />
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md">
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
    </PagesLayout>
  );
}
