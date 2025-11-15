import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'

export interface DepartmentFormData {
  nome: string
  sigla: string
  descricao: string
  instituto: string
  coordenador: string
  email: string
  telefone: string
}

interface DepartmentFormDialogProps {
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  formData: DepartmentFormData
  setFormData: (data: DepartmentFormData) => void
  onSubmit: () => void
  isLoading?: boolean
  title: string
  description: string
  submitLabel: string
}

export function DepartmentFormDialog({
  isOpen,
  onOpenChange,
  formData,
  setFormData,
  onSubmit,
  isLoading = false,
  title,
  description,
  submitLabel,
}: DepartmentFormDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nome">Nome do Departamento *</Label>
              <Input
                id="nome"
                value={formData.nome}
                onChange={(e) =>
                  setFormData({ ...formData, nome: e.target.value })
                }
                placeholder="Ex: Ciência da Computação"
              />
            </div>

            <div>
              <Label htmlFor="sigla">Sigla *</Label>
              <Input
                id="sigla"
                value={formData.sigla}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    sigla: e.target.value.toUpperCase(),
                  })
                }
                placeholder="Ex: DCC"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="instituto">Instituto</Label>
            <Input
              id="instituto"
              value={formData.instituto}
              onChange={(e) =>
                setFormData({ ...formData, instituto: e.target.value })
              }
              placeholder="Ex: Instituto de Matemática e Estatística"
            />
          </div>

          <div>
            <Label htmlFor="coordenador">Coordenador</Label>
            <Input
              id="coordenador"
              value={formData.coordenador}
              onChange={(e) =>
                setFormData({ ...formData, coordenador: e.target.value })
              }
              placeholder="Nome do coordenador"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                placeholder="departamento@ufba.br"
              />
            </div>

            <div>
              <Label htmlFor="telefone">Telefone</Label>
              <Input
                id="telefone"
                value={formData.telefone}
                onChange={(e) =>
                  setFormData({ ...formData, telefone: e.target.value })
                }
                placeholder="(71) 3283-6800"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="descricao">Descrição</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) =>
                setFormData({ ...formData, descricao: e.target.value })
              }
              placeholder="Descrição do departamento..."
              rows={3}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onSubmit} disabled={isLoading}>
            {isLoading ? 'Salvando...' : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
