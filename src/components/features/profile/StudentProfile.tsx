"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { api } from "@/utils/api"
import { useEffect, useState } from "react"

interface StudentFormData {
  nomeCompleto: string
  matricula: string
  cpf: string
  cursoNome: string
  cr: number
  banco: string
  agencia: string
  conta: string
  digitoConta: string
}

export function StudentProfile() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<StudentFormData>({
    nomeCompleto: "",
    matricula: "",
    cpf: "",
    cursoNome: "",
    cr: 0,
    banco: "",
    agencia: "",
    conta: "",
    digitoConta: "",
  })

  const { data: userProfile } = api.user.getProfile.useQuery()
  const updateProfileMutation = api.user.updateProfile.useMutation()

  const aluno = userProfile?.studentProfile

  useEffect(() => {
    if (aluno) {
      setFormData({
        nomeCompleto: aluno.nomeCompleto || "",
        matricula: aluno.matricula || "",
        cpf: aluno.cpf || "",
        cursoNome: aluno.cursoNome || "",
        cr: aluno.cr || 0,
        banco: aluno.banco || "",
        agencia: aluno.agencia || "",
        conta: aluno.conta || "",
        digitoConta: aluno.digitoConta || "",
      })
    }
  }, [aluno])

  const handleSave = async () => {
    try {
      await updateProfileMutation.mutateAsync({
        studentData: {
          nomeCompleto: formData.nomeCompleto,
          matricula: formData.matricula,
          cpf: formData.cpf,
          cursoNome: formData.cursoNome,
          cr: formData.cr,
          banco: formData.banco,
          agencia: formData.agencia,
          conta: formData.conta,
          digitoConta: formData.digitoConta,
        },
      })

      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram atualizadas com sucesso",
      })

      setIsEditing(false)
    } catch (error) {
      toast({
        title: "Erro ao atualizar",
        description: error instanceof Error ? error.message : "Não foi possível atualizar o perfil",
        variant: "destructive",
      })
    }
  }

  const handleCancel = () => {
    if (aluno) {
      setFormData({
        nomeCompleto: aluno.nomeCompleto || "",
        matricula: aluno.matricula || "",
        cpf: aluno.cpf || "",
        cursoNome: aluno.cursoNome || "",
        cr: aluno.cr || 0,
        banco: aluno.banco || "",
        agencia: aluno.agencia || "",
        conta: aluno.conta || "",
        digitoConta: aluno.digitoConta || "",
      })
    }
    setIsEditing(false)
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle>Dados Pessoais</CardTitle>
            {!isEditing ? (
              <Button onClick={() => setIsEditing(true)}>Editar</Button>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleCancel}>
                  Cancelar
                </Button>
                <Button onClick={handleSave}>Salvar</Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nomeCompleto">Nome Completo</Label>
              <Input
                id="nomeCompleto"
                value={formData.nomeCompleto}
                onChange={(e) => setFormData({ ...formData, nomeCompleto: e.target.value })}
                disabled={!isEditing}
              />
            </div>

            <div>
              <Label htmlFor="matricula">Matrícula</Label>
              <Input
                id="matricula"
                value={formData.matricula}
                onChange={(e) => setFormData({ ...formData, matricula: e.target.value })}
                disabled={!isEditing}
              />
            </div>

            <div>
              <Label htmlFor="cpf">CPF</Label>
              <Input
                id="cpf"
                value={formData.cpf}
                onChange={(e) => setFormData({ ...formData, cpf: e.target.value })}
                disabled={!isEditing}
              />
            </div>

            <div>
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" value={user?.email || ""} disabled className="bg-gray-50" />
            </div>

            <div>
              <Label htmlFor="cursoNome">Curso</Label>
              <Input
                id="cursoNome"
                value={formData.cursoNome}
                onChange={(e) => setFormData({ ...formData, cursoNome: e.target.value })}
                disabled={!isEditing}
                placeholder="Digite o nome do seu curso"
              />
            </div>

            <div>
              <Label htmlFor="cr">CR (Coeficiente de Rendimento)</Label>
              <Input
                id="cr"
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={formData.cr}
                onChange={(e) => setFormData({ ...formData, cr: parseFloat(e.target.value) })}
                disabled={!isEditing}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dados Bancários (para Bolsistas)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="banco">Banco</Label>
              <Input
                id="banco"
                value={formData.banco}
                onChange={(e) => setFormData({ ...formData, banco: e.target.value })}
                disabled={!isEditing}
                placeholder="Ex: Banco do Brasil"
              />
            </div>
            <div>
              <Label htmlFor="agencia">Agência</Label>
              <Input
                id="agencia"
                value={formData.agencia}
                onChange={(e) => setFormData({ ...formData, agencia: e.target.value })}
                disabled={!isEditing}
                placeholder="Ex: 1234-5"
              />
            </div>
            <div>
              <Label htmlFor="conta">Conta Corrente</Label>
              <Input
                id="conta"
                value={formData.conta}
                onChange={(e) => setFormData({ ...formData, conta: e.target.value })}
                disabled={!isEditing}
                placeholder="Ex: 12345-6"
              />
            </div>
            <div>
              <Label htmlFor="digitoConta">Dígito</Label>
              <Input
                id="digitoConta"
                value={formData.digitoConta}
                onChange={(e) => setFormData({ ...formData, digitoConta: e.target.value })}
                disabled={!isEditing}
                maxLength={2}
                placeholder="Ex: 7"
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </>
  )
}
