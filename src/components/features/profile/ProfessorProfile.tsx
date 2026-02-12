"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/use-auth"
import { api } from "@/utils/api"
import { useEffect, useState } from "react"
import {
  REGIME_20H,
  REGIME_40H,
  REGIME_DE,
  TIPO_PROFESSOR_EFETIVO,
  TIPO_PROFESSOR_SUBSTITUTO,
  TIPO_PROFESSOR_LABELS,
  normalizePhone,
  type Regime,
  type TipoProfessor,
} from "@/types"

interface ProfessorFormData {
  nomeCompleto: string
  matriculaSiape: string
  cpf: string
  telefone: string
  telefoneInstitucional: string
  regime: Regime | ""
  tipoProfessor: TipoProfessor | ""
}

export function ProfessorProfile() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [isEditing, setIsEditing] = useState(false)
  const [formData, setFormData] = useState<ProfessorFormData>({
    nomeCompleto: "",
    matriculaSiape: "",
    cpf: "",
    telefone: "",
    telefoneInstitucional: "",
    regime: "",
    tipoProfessor: "",
  })

  const { data: userProfile } = api.user.getProfile.useQuery()
  const updateProfileMutation = api.user.updateProfile.useMutation()

  const professor = userProfile?.professorProfile

  useEffect(() => {
    if (professor) {
      setFormData({
        nomeCompleto: professor.nomeCompleto || "",
        matriculaSiape: professor.matriculaSiape || "",
        cpf: professor.cpf || "",
        telefone: normalizePhone(professor.telefone) || "",
        telefoneInstitucional: normalizePhone(professor.telefoneInstitucional) || "",
        regime: professor.regime || "",
        tipoProfessor: professor.tipoProfessor || "",
      })
    }
  }, [professor])

  const handleSave = async () => {
    try {
      if (!formData.regime) {
        toast({
          title: "Campo obrigatório",
          description: "Por favor, selecione um regime de trabalho",
          variant: "destructive",
        })
        return
      }

      await updateProfileMutation.mutateAsync({
        professorData: {
          nomeCompleto: formData.nomeCompleto,
          cpf: formData.cpf,
          telefone: formData.telefone,
          telefoneInstitucional: formData.telefoneInstitucional,
          regime: formData.regime,
          tipoProfessor: formData.tipoProfessor || undefined,
          matriculaSiape: formData.matriculaSiape || undefined,
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
    if (professor) {
      setFormData({
        nomeCompleto: professor.nomeCompleto || "",
        matriculaSiape: professor.matriculaSiape || "",
        cpf: professor.cpf || "",
        telefone: normalizePhone(professor.telefone) || "",
        telefoneInstitucional: normalizePhone(professor.telefoneInstitucional) || "",
        regime: professor.regime || "",
        tipoProfessor: professor.tipoProfessor || "",
      })
    }
    setIsEditing(false)
  }

  return (
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
              <Button
                onClick={handleSave}
                disabled={updateProfileMutation.isPending}
                isLoading={updateProfileMutation.isPending}
              >
                Salvar
              </Button>
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
            <Label htmlFor="matriculaSiape">Matrícula SIAPE</Label>
            <Input
              id="matriculaSiape"
              value={formData.matriculaSiape}
              onChange={(e) => setFormData({ ...formData, matriculaSiape: e.target.value })}
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
            <Label htmlFor="telefone">Telefone Pessoal</Label>
            <Input
              id="telefone"
              value={formData.telefone}
              onChange={(e) => setFormData({ ...formData, telefone: e.target.value })}
              disabled={!isEditing}
              placeholder="(xx) xxxxx-xxxx"
            />
          </div>

          <div>
            <Label htmlFor="telefoneInstitucional">Telefone Institucional</Label>
            <Input
              id="telefoneInstitucional"
              value={formData.telefoneInstitucional}
              onChange={(e) => setFormData({ ...formData, telefoneInstitucional: e.target.value })}
              disabled={!isEditing}
              placeholder="(xx) xxxx-xxxx"
            />
          </div>

          <div>
            <Label htmlFor="regime">Regime de Trabalho</Label>
            <Select
              value={formData.regime}
              onValueChange={(value: Regime) => setFormData({ ...formData, regime: value })}
            >
              <SelectTrigger disabled={!isEditing}>
                <SelectValue placeholder="Selecione o regime" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={REGIME_20H}>20 horas</SelectItem>
                <SelectItem value={REGIME_40H}>40 horas</SelectItem>
                <SelectItem value={REGIME_DE}>Dedicação Exclusiva</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="tipoProfessor">Tipo de Professor</Label>
            <Select
              value={formData.tipoProfessor}
              onValueChange={(value: TipoProfessor) => setFormData({ ...formData, tipoProfessor: value })}
            >
              <SelectTrigger disabled={!isEditing}>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={TIPO_PROFESSOR_EFETIVO}>
                  {TIPO_PROFESSOR_LABELS[TIPO_PROFESSOR_EFETIVO]}
                </SelectItem>
                <SelectItem value={TIPO_PROFESSOR_SUBSTITUTO}>
                  {TIPO_PROFESSOR_LABELS[TIPO_PROFESSOR_SUBSTITUTO]}
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
