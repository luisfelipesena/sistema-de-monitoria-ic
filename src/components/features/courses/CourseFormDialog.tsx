import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  MODALIDADE_CURSO_EAD,
  MODALIDADE_CURSO_HIBRIDO,
  MODALIDADE_CURSO_PRESENCIAL,
  TIPO_CURSO_BACHARELADO,
  TIPO_CURSO_LICENCIATURA,
  TIPO_CURSO_POS_GRADUACAO,
  TIPO_CURSO_TECNICO,
  type ModalidadeCurso,
  type TipoCurso,
} from "@/types";

interface DepartmentSimple {
  id: number;
  nome: string;
  sigla?: string | null;
}

export interface CourseFormData {
  nome: string;
  codigo: string;
  tipo: TipoCurso | "";
  modalidade: ModalidadeCurso | "";
  duracao: number;
  cargaHoraria: number;
  descricao: string;
  departamentoId: string;
  coordenador: string;
  emailCoordenacao: string;
}

interface CourseFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  formData: CourseFormData;
  setFormData: (data: CourseFormData) => void;
  departamentos: DepartmentSimple[];
  onSubmit: () => void;
  isLoading?: boolean;
  title: string;
  description: string;
  submitLabel: string;
}

export function CourseFormDialog({
  isOpen,
  onOpenChange,
  formData,
  setFormData,
  departamentos,
  onSubmit,
  isLoading = false,
  title,
  description,
  submitLabel,
}: CourseFormDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nome">Nome do Curso *</Label>
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
              <Label htmlFor="codigo">Código *</Label>
              <Input
                id="codigo"
                value={formData.codigo}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    codigo: e.target.value.toUpperCase(),
                  })
                }
                placeholder="Ex: 112140"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tipo">Tipo *</Label>
              <Select
                value={formData.tipo}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    tipo: value as CourseFormData["tipo"],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o tipo" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={TIPO_CURSO_BACHARELADO}>Bacharelado</SelectItem>
                  <SelectItem value={TIPO_CURSO_LICENCIATURA}>Licenciatura</SelectItem>
                  <SelectItem value={TIPO_CURSO_TECNICO}>Técnico</SelectItem>
                  <SelectItem value={TIPO_CURSO_POS_GRADUACAO}>Pós-Graduação</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="modalidade">Modalidade *</Label>
              <Select
                value={formData.modalidade}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    modalidade: value as CourseFormData["modalidade"],
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione a modalidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={MODALIDADE_CURSO_PRESENCIAL}>Presencial</SelectItem>
                  <SelectItem value={MODALIDADE_CURSO_EAD}>EAD</SelectItem>
                  <SelectItem value={MODALIDADE_CURSO_HIBRIDO}>Híbrido</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="duracao">Duração (semestres)</Label>
              <Input
                id="duracao"
                type="number"
                value={formData.duracao}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    duracao: parseInt(e.target.value) || 0,
                  })
                }
                placeholder="8"
              />
            </div>

            <div>
              <Label htmlFor="cargaHoraria">Carga Horária (horas)</Label>
              <Input
                id="cargaHoraria"
                type="number"
                value={formData.cargaHoraria}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    cargaHoraria: parseInt(e.target.value) || 0,
                  })
                }
                placeholder="3000"
              />
            </div>

            <div>
              <Label htmlFor="departamento">Departamento *</Label>
              <Select
                value={formData.departamentoId}
                onValueChange={(value) =>
                  setFormData({ ...formData, departamentoId: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o departamento" />
                </SelectTrigger>
                <SelectContent>
                  {departamentos.map((dep) => (
                    <SelectItem key={dep.id} value={dep.id.toString()}>
                      {dep.nome}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
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

            <div>
              <Label htmlFor="emailCoordenacao">Email da Coordenação</Label>
              <Input
                id="emailCoordenacao"
                type="email"
                value={formData.emailCoordenacao}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    emailCoordenacao: e.target.value,
                  })
                }
                placeholder="coordenacao@ufba.br"
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
              placeholder="Descrição do curso"
              className="min-h-[100px]"
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button onClick={onSubmit} disabled={isLoading}>
            {isLoading ? "Salvando..." : submitLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}