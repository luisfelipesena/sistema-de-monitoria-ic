"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useAuth } from "@/hooks/use-auth"
import { ADMIN_TYPE_DCC, ADMIN_TYPE_DCI, ADMIN_TYPE_LABELS, type AdminType } from "@/types"
import { api } from "@/utils/api"
import { formatUsernameToProperName } from "@/utils/username-formatter"
import { useState } from "react"
import { toast } from "sonner"

export function AdminProfile() {
  const { user } = useAuth()
  const utils = api.useUtils()
  const [selectedAdminType, setSelectedAdminType] = useState<AdminType | null>(
    user?.adminType ?? null
  )

  const updateAdminTypeMutation = api.user.updateAdminType.useMutation({
    onSuccess: () => {
      toast.success("Tipo de administrador atualizado")
      utils.me.getMe.invalidate()
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao atualizar tipo")
    },
  })

  const handleSave = () => {
    if (!selectedAdminType) {
      toast.error("Selecione um tipo de administrador")
      return
    }
    updateAdminTypeMutation.mutate({ adminType: selectedAdminType })
  }

  const hasChanges = selectedAdminType !== user?.adminType

  return (
    <Card>
      <CardHeader>
        <CardTitle>Informações do Administrador</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div>
            <Label>Nome</Label>
            <Input value={formatUsernameToProperName(user?.username || "")} disabled className="bg-gray-50" />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={user?.email || ""} disabled className="bg-gray-50" />
          </div>
          <div>
            <Label>Função</Label>
            <Input value="Administrador" disabled className="bg-gray-50" />
          </div>
          <div>
            <Label>Departamento</Label>
            <Select
              value={selectedAdminType ?? undefined}
              onValueChange={(value) => setSelectedAdminType(value as AdminType)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o departamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ADMIN_TYPE_DCC}>{ADMIN_TYPE_LABELS[ADMIN_TYPE_DCC]}</SelectItem>
                <SelectItem value={ADMIN_TYPE_DCI}>{ADMIN_TYPE_LABELS[ADMIN_TYPE_DCI]}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {hasChanges && (
            <Button
              onClick={handleSave}
              disabled={updateAdminTypeMutation.isPending}
            >
              {updateAdminTypeMutation.isPending ? "Salvando..." : "Salvar"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
