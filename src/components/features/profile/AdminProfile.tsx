"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useAuth } from "@/hooks/use-auth"
import { formatUsernameToProperName } from "@/utils/username-formatter"

export function AdminProfile() {
  const { user } = useAuth()

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
        </div>
      </CardContent>
    </Card>
  )
}
