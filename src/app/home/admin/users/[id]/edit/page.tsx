'use client'

import { PagesLayout } from '@/components/layout/PagesLayout'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { api } from '@/utils/api'
import { useRouter } from 'next/navigation'
import { useParams } from 'next/navigation'
import { useState, useEffect } from 'react'
import { useToast } from "@/hooks/use-toast"
import { ArrowLeft, Save, User, Loader } from 'lucide-react'
import { formatUsernameToProperName } from '@/utils/username-formatter'

export default function EditUserPage() {
  const { toast } = useToast()

  const router = useRouter()
  const params = useParams()
  const userId = parseInt(params.id as string)

  const [formData, setFormData] = useState<{
    username: string
    email: string
    role: 'admin' | 'professor' | 'student'
  }>({
    username: '',
    email: '',
    role: 'student',
  })

  const { data: user, isLoading } = api.user.getUserById.useQuery({ id: userId })
  const updateUserMutation = api.user.updateUser.useMutation({
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: 'Usuário atualizado com sucesso!',
      })
      router.push('/home/admin/users')
      window.location.reload()
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro ao atualizar usuário: ${error.message}`,
        variant: "destructive",
      })
    },
  })

  useEffect(() => {
    if (user) {
      setFormData({
        username: user.username,
        email: user.email,
        role: user.role as 'admin' | 'professor' | 'student',
      })
    }
  }, [user])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    updateUserMutation.mutate({
      id: userId,
      username: formData.username,
      email: formData.email,
      role: formData.role,
    })
  }

  const handleBack = () => {
    router.push('/home/admin/users')
  }

  if (isLoading) {
    return (
      <PagesLayout title="Carregando...">
        <div className="flex justify-center items-center py-8">
          <Loader className="h-8 w-8 animate-spin" />
          <span className="ml-2">Carregando dados do usuário...</span>
        </div>
      </PagesLayout>
    )
  }

  if (!user) {
    return (
      <PagesLayout title="Usuário não encontrado">
        <div className="text-center py-8">
          <p className="text-muted-foreground">Usuário não encontrado</p>
          <Button onClick={handleBack} className="mt-4">
            Voltar para lista de usuários
          </Button>
        </div>
      </PagesLayout>
    )
  }

  return (
    <PagesLayout 
      title="Editar Usuário" 
      subtitle={`Editando dados de ${formatUsernameToProperName(user.username)}`}
    >
      <div className="mb-4">
        <Button variant="outline" onClick={handleBack}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar para Usuários
        </Button>
      </div>

      <Card className="max-w-2xl">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            Dados do Usuário
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="username">Nome de Usuário</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div>
              <Label htmlFor="role">Papel</Label>
              <Select 
                value={formData.role} 
                onValueChange={(value) => setFormData({ ...formData, role: value as 'admin' | 'professor' | 'student' })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um papel" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Administrador</SelectItem>
                  <SelectItem value="professor">Professor</SelectItem>
                  <SelectItem value="student">Estudante</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 pt-4">
              <Button 
                type="submit" 
                disabled={updateUserMutation.isPending}
                className="flex-1"
              >
                <Save className="h-4 w-4 mr-2" />
                {updateUserMutation.isPending ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={handleBack}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </PagesLayout>
  )
}