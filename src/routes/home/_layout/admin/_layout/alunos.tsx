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
import { useSetAluno } from '@/hooks/use-aluno';
import { useCursos } from '@/hooks/use-curso';
import { useUsers } from '@/hooks/use-user';
import { createFileRoute } from '@tanstack/react-router';
import { ColumnDef } from '@tanstack/react-table';
import { GraduationCap, Loader, Mail, Pencil, Plus, User } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

export const Route = createFileRoute('/home/_layout/admin/_layout/alunos')({
  component: AlunosPage,
});

interface AlunoFormData {
  userId: number;
  cursoId: number;
  nomeCompleto: string;
  emailInstitucional: string;
  matricula: string;
  genero: 'MASCULINO' | 'FEMININO' | 'OUTRO';
  cpf: string;
  cr: number;
  telefone?: string;
}

function AlunosPage() {
  const { data: users, isLoading: loadingUsers } = useUsers();
  const { data: cursos } = useCursos();
  const setAlunoMutation = useSetAluno();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingAlunoId, setEditingAlunoId] = useState<number | null>(null);
  const [formData, setFormData] = useState<Partial<AlunoFormData>>({});
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);

  const alunos = users?.filter((user) => user.role === 'student') || [];
  const availableUsers = users?.filter((user) => user.role === 'student') || [];

  const handleCreateAluno = async () => {
    if (
      !selectedUserId ||
      !formData.cursoId ||
      !formData.nomeCompleto ||
      !formData.emailInstitucional ||
      !formData.matricula ||
      !formData.cpf ||
      !formData.genero ||
      !formData.cr
    ) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    try {
      await setAlunoMutation.mutateAsync({
        cursoId: formData.cursoId,
        nomeCompleto: formData.nomeCompleto,
        emailInstitucional: formData.emailInstitucional,
        matricula: formData.matricula,
        genero: formData.genero,
        cpf: formData.cpf,
        cr: formData.cr,
        telefone: formData.telefone,
        nomeSocial: undefined,
        especificacaoGenero: undefined,
        rg: undefined,
        enderecoId: undefined,
        comprovanteMatriculaFileId: '',
      });

      toast.success(
        isEditMode
          ? 'Aluno atualizado com sucesso!'
          : 'Aluno configurado com sucesso!',
      );
      setIsModalOpen(false);
      setFormData({});
      setSelectedUserId(null);
      setIsEditMode(false);
      setEditingAlunoId(null);
    } catch (error) {
      toast.error(
        isEditMode ? 'Erro ao atualizar aluno' : 'Erro ao configurar aluno',
      );
    }
  };

  const handleEditAluno = (alunoId: number) => {
    const aluno = alunos.find((a) => a.id === alunoId);
    if (aluno) {
      setIsEditMode(true);
      setEditingAlunoId(alunoId);
      setSelectedUserId(aluno.id);
      setFormData({
        userId: aluno.id,
        nomeCompleto: aluno.username,
        emailInstitucional: aluno.email,
        cursoId: undefined,
        matricula: '',
        genero: 'MASCULINO',
        cpf: '',
        cr: 0,
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
          <GraduationCap className="h-5 w-5 text-gray-400" />
          Status
        </div>
      ),
      accessorKey: 'role',
      cell: ({ row }) => <Badge variant="secondary">Aluno</Badge>,
    },
    {
      header: 'Ações',
      accessorKey: 'acoes',
      cell: ({ row }) => (
        <Button
          variant="secondary"
          size="sm"
          className="rounded-full flex items-center gap-1"
          onClick={() => handleEditAluno(row.original.id)}
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
        setEditingAlunoId(null);
        setFormData({});
        setSelectedUserId(null);
        setIsModalOpen(true);
      }}
    >
      <Plus className="w-4 h-4 mr-2" />
      Configurar Aluno
    </Button>
  );

  return (
    <PagesLayout title="Gerenciar Alunos" actions={actions}>
      {loadingUsers ? (
        <div className="flex justify-center items-center py-8">
          <Loader className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando alunos...</span>
        </div>
      ) : (
        <TableComponent columns={columns} data={alunos} />
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isEditMode
                ? 'Editar Perfil de Aluno'
                : 'Configurar Perfil de Aluno'}
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
              <Label>Curso *</Label>
              <Select
                value={formData.cursoId?.toString() || ''}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, cursoId: parseInt(value) }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o curso" />
                </SelectTrigger>
                <SelectContent>
                  {cursos?.map((curso) => (
                    <SelectItem key={curso.id} value={curso.id.toString()}>
                      {curso.nome}
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
                placeholder="Nome completo do aluno"
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
              <Label>Matrícula *</Label>
              <Input
                value={formData.matricula || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    matricula: e.target.value,
                  }))
                }
                placeholder="Matrícula do aluno"
              />
            </div>

            <div>
              <Label>CPF *</Label>
              <Input
                value={formData.cpf || ''}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, cpf: e.target.value }))
                }
                placeholder="CPF do aluno"
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
              <Label>CR (Coeficiente de Rendimento) *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="10"
                value={formData.cr || ''}
                onChange={(e) =>
                  setFormData((prev) => ({
                    ...prev,
                    cr: parseFloat(e.target.value),
                  }))
                }
                placeholder="CR do aluno"
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
                placeholder="Telefone do aluno"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsModalOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleCreateAluno}>
              {isEditMode ? 'Atualizar Aluno' : 'Configurar Aluno'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PagesLayout>
  );
}
