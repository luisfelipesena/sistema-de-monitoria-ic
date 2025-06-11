"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { api } from "@/utils/api"
import { useState } from "react"
import { toast } from "sonner"
import { Copy, Key, Plus, Trash2, Eye, EyeOff } from "lucide-react"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { useAuth } from "@/hooks/use-auth"

export default function UserApiKeysPage() {
  const { user } = useAuth()
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const [newKeyName, setNewKeyName] = useState("")
  const [newKeyDescription, setNewKeyDescription] = useState("")
  const [newKeyExpiration, setNewKeyExpiration] = useState("")
  const [generatedKey, setGeneratedKey] = useState<string | null>(null)
  const [showKey, setShowKey] = useState(false)

  if (!user) {
    return <div>Carregando...</div>
  }

  const { data: apiKeys, refetch } = api.apiKey.list.useQuery({ userId: user.id })
  const createApiKeyMutation = api.apiKey.create.useMutation()
  const deleteApiKeyMutation = api.apiKey.delete.useMutation()
  const updateApiKeyMutation = api.apiKey.update.useMutation()

  const handleCreateApiKey = async () => {
    try {
      const expiresAt = newKeyExpiration ? new Date(newKeyExpiration) : undefined
      
      const result = await createApiKeyMutation.mutateAsync({
        name: newKeyName,
        description: newKeyDescription,
        expiresAt,
      })

      setGeneratedKey(result.key)
      setShowKey(true)
      setNewKeyName("")
      setNewKeyDescription("")
      setNewKeyExpiration("")
      toast.success("API Key criada com sucesso!")
      await refetch()
    } catch (error) {
      toast.error("Erro ao criar API Key")
    }
  }

  const handleDeleteApiKey = async (id: number) => {
    if (confirm("Tem certeza que deseja deletar esta API Key?")) {
      try {
        await deleteApiKeyMutation.mutateAsync({ id })
        toast.success("API Key deletada com sucesso!")
        await refetch()
      } catch (error) {
        toast.error("Erro ao deletar API Key")
      }
    }
  }

  const handleToggleActive = async (id: number, isActive: boolean) => {
    try {
      await updateApiKeyMutation.mutateAsync({ id, isActive: !isActive })
      toast.success(`API Key ${!isActive ? 'ativada' : 'desativada'} com sucesso!`)
      await refetch()
    } catch (error) {
      toast.error("Erro ao atualizar API Key")
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success("Copiado para a área de transferência!")
  }

  const closeGeneratedKeyDialog = () => {
    setGeneratedKey(null)
    setShowKey(false)
    setCreateDialogOpen(false)
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Minhas API Keys</h1>
          <p className="text-gray-600 mt-2">
            Gerencie suas chaves de API para integração programática com o sistema
          </p>
        </div>
        
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Nova API Key
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova API Key</DialogTitle>
              <DialogDescription>
                Crie uma nova chave de API para autenticação programática
              </DialogDescription>
            </DialogHeader>
            
            {generatedKey ? (
              <div className="space-y-4">
                <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                  <p className="text-yellow-800 font-medium mb-2">
                    ⚠️ Importante: Copie esta chave agora!
                  </p>
                  <p className="text-yellow-700 text-sm">
                    Esta é a única vez que você verá a chave completa. Guarde-a em local seguro.
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label>Sua nova API Key:</Label>
                  <div className="flex items-center space-x-2">
                    <Input
                      value={showKey ? generatedKey : "•".repeat(48)}
                      readOnly
                      className="font-mono text-sm"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowKey(!showKey)}
                    >
                      {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => copyToClipboard(generatedKey)}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="keyName">Nome da Chave</Label>
                  <Input
                    id="keyName"
                    placeholder="Ex: Integração com script pessoal"
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="keyDescription">Descrição (opcional)</Label>
                  <Textarea
                    id="keyDescription"
                    placeholder="Descreva o uso desta chave..."
                    value={newKeyDescription}
                    onChange={(e) => setNewKeyDescription(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="keyExpiration">Data de Expiração (opcional)</Label>
                  <Input
                    id="keyExpiration"
                    type="datetime-local"
                    value={newKeyExpiration}
                    onChange={(e) => setNewKeyExpiration(e.target.value)}
                  />
                </div>
              </div>
            )}
            
            <DialogFooter>
              {generatedKey ? (
                <Button onClick={closeGeneratedKeyDialog}>
                  Entendi, fechar
                </Button>
              ) : (
                <>
                  <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
                    Cancelar
                  </Button>
                  <Button 
                    onClick={handleCreateApiKey} 
                    disabled={!newKeyName.trim() || createApiKeyMutation.isPending}
                  >
                    {createApiKeyMutation.isPending ? "Criando..." : "Criar API Key"}
                  </Button>
                </>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-6">
        {apiKeys?.map((apiKey) => (
          <Card key={apiKey.id}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    {apiKey.name}
                    <Badge variant={apiKey.isActive ? "default" : "secondary"}>
                      {apiKey.isActive ? "Ativa" : "Inativa"}
                    </Badge>
                  </CardTitle>
                  {apiKey.description && (
                    <CardDescription className="mt-1">
                      {apiKey.description}
                    </CardDescription>
                  )}
                </div>
                
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleToggleActive(apiKey.id, apiKey.isActive)}
                  >
                    {apiKey.isActive ? "Desativar" : "Ativar"}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteApiKey(apiKey.id)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <p className="text-gray-500">Criada em</p>
                  <p className="font-medium">
                    {format(new Date(apiKey.createdAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
                  </p>
                </div>
                
                <div>
                  <p className="text-gray-500">Último uso</p>
                  <p className="font-medium">
                    {apiKey.lastUsedAt 
                      ? format(new Date(apiKey.lastUsedAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                      : "Nunca usado"
                    }
                  </p>
                </div>
                
                <div>
                  <p className="text-gray-500">Expira em</p>
                  <p className="font-medium">
                    {apiKey.expiresAt 
                      ? format(new Date(apiKey.expiresAt), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })
                      : "Nunca expira"
                    }
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
        
        {!apiKeys?.length && (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Key className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma API Key encontrada
              </h3>
              <p className="text-gray-500 text-center mb-4">
                Crie sua primeira API Key para começar a usar a integração programática
              </p>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Criar primeira API Key
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
} 