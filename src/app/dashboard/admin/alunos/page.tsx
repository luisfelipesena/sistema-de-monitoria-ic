"use client"

import { PagesLayout } from "@/components/layout/PagesLayout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DataTable } from "@/components/ui/data-table"
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserRole } from "@/types/enums"
import { api } from "@/utils/api"
import { ColumnDef } from "@tanstack/react-table"
import { GraduationCap, Loader, Mail, Pencil, Plus, User } from "lucide-react"
import { useState } from "react"
import { toast } from "sonner"

type UserWithStudent = {
  id: number
  username: string
  email: string
  role: UserRole
  profile: {
    id: number
    nomeCompleto: string
    tipo: "professor" | "aluno"
  } | null
}

interface AlunoFormData {
  userId: number
  cursoId: number
  nomeCompleto: string
  emailInstitucional: string
  matricula: string
  cpf: string
  cr: number
  telefone?: string
}

export default function AlunosPage() {
  const utils = api.useUtils()
  const { data: usersData, isLoading: loadingUsers } = api.user.list.useQuery({
    role: UserRole.STUDENT,
    page: 1,
    limit: 100,
  })
  const { data: cursos } = api.curso.list.useQuery({})

  const createStudentMutation = api.student.createStudentProfile.useMutation({
    onSuccess: () => {
      toast.success("Aluno configurado com sucesso!")
      utils.user.list.invalidate()
    },
    onError: (error: any) => {
      toast.error("Erro ao configurar aluno", {
        description: error instanceof Error ? error.message : "Erro desconhecido",
      })
    },
  })

  const [isModalOpen, setIsModalOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingAlunoId, setEditingAlunoId] = useState<number | null>(null)
  const [formData, setFormData] = useState<Partial<AlunoFormData>>({})
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null)

  const alunos = usersData?.users?.filter((user: any) => user.role === UserRole.STUDENT) || []
  const availableUsers = usersData?.users?.filter((user: any) => user.role === UserRole.STUDENT) || []

  const handleCreateAluno = async () => {
    if (
      !selectedUserId ||
      !formData.cursoId ||
      !formData.nomeCompleto ||
      !formData.emailInstitucional ||
      !formData.matricula ||
      !formData.cpf ||
      formData.cr === undefined
    ) {
      toast.error("Preencha todos os campos obrigatórios")
      return
    }

    try {
      await createStudentMutation.mutateAsync({
        userId: selectedUserId,
        cursoId: formData.cursoId,
        nomeCompleto: formData.nomeCompleto,
        emailInstitucional: formData.emailInstitucional,
        matricula: formData.matricula,
        cpf: formData.cpf,
        cr: formData.cr,
        telefone: formData.telefone,
        comprovanteMatriculaFileId: "temp-file-id",
      })

      setIsModalOpen(false)
      setFormData({})
      setSelectedUserId(null)
      setIsEditMode(false)
      setEditingAlunoId(null)
    } catch (error) {
      toast.error("Erro ao configurar aluno", {
        description: error instanceof Error ? error.message : "Erro desconhecido",
      })
    }
  }

  const handleEditAluno = (alunoId: number) => {
    const aluno = alunos.find((a) => a.id === alunoId)
    if (aluno) {
      setIsEditMode(true)
      setEditingAlunoId(alunoId)
      setSelectedUserId(aluno.id)
      setFormData({
        userId: aluno.id,
        nomeCompleto: aluno.username,
        emailInstitucional: aluno.email,
        cursoId: undefined,
        matricula: "",
        cpf: "",
        cr: 0,
      })
      setIsModalOpen(true)
    }
  }

  const columns: ColumnDef<UserWithStudent>[] = [
    {
      header: () => (
        <div className="flex items-center gap-2">
          <User className="h-5 w-5 text-gray-400" />
          Nome
        </div>
      ),
      accessorKey: "username",
      cell: ({ row }) => <span className="font-semibold text-base text-gray-900">{row.original.username}</span>,
    },
    {
      header: () => (
        <div className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-gray-400" />
          Email
        </div>
      ),
      accessorKey: "email",
    },
    {
      header: () => (
        <div className="flex items-center gap-2">
          <GraduationCap className="h-5 w-5 text-gray-400" />
          Status
        </div>
      ),
      accessorKey: "role",
      cell: ({ row }) => <Badge variant="secondary">Aluno</Badge>,
    },
    {
      header: "Ações",
      accessorKey: "acoes",
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
  ]

  const actions = (
    <Button
      variant="primary"
      className="bg-[#1B2A50] text-white hover:bg-[#24376c] transition-colors"
      onClick={() => {
        setIsEditMode(false)
        setEditingAlunoId(null)
        setFormData({})
        setSelectedUserId(null)
        setIsModalOpen(true)
      }}
    >
      <Plus className="w-4 h-4 mr-2" />
      Configurar Aluno
    </Button>
  )

  return (
    <PagesLayout title="Gerenciar Alunos" actions={actions}>
      {loadingUsers ? (
        <div className="flex justify-center items-center py-8">
          <Loader className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando alunos...</span>
        </div>
      ) : (
        <DataTable columns={columns} data={alunos} />
      )}

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{isEditMode ? "Editar Perfil de Aluno" : "Configurar Perfil de Aluno"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            {!isEditMode && (
              <div>
                <Label>Selecionar Usuário</Label>
                <Select
                  value={selectedUserId?.toString() || ""}
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
                value={formData.cursoId?.toString() || ""}
                onValueChange={(value) => setFormData((prev) => ({ ...prev, cursoId: parseInt(value) }))}
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
                value={formData.nomeCompleto || ""}
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
                value={formData.emailInstitucional || ""}
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
                value={formData.matricula || ""}
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
                value={formData.cpf || ""}
                onChange={(e) => setFormData((prev) => ({ ...prev, cpf: e.target.value }))}
                placeholder="CPF do aluno"
              />
            </div>

            <div>
              <Label>CR (Coeficiente de Rendimento) *</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                max="10"
                value={formData.cr || ""}
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
                value={formData.telefone || ""}
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
            <Button onClick={handleCreateAluno} disabled={createStudentMutation.isPending}>
              {createStudentMutation.isPending ? (
                <Loader className="animate-spin" />
              ) : isEditMode ? (
                "Atualizar Aluno"
              ) : (
                "Configurar Aluno"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PagesLayout>
  )
}
