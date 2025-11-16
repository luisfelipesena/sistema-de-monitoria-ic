"use client";

import { CourseDeleteDialog } from "@/components/features/courses/CourseDeleteDialog";
import {
  CourseFormData,
  CourseFormDialog,
} from "@/components/features/courses/CourseFormDialog";
import { CourseStatsCards } from "@/components/features/courses/CourseStatsCards";
import { createCourseTableColumns } from "@/components/features/courses/CourseTableColumns";
import { PagesLayout } from "@/components/layout/PagesLayout";
import { TableComponent } from "@/components/layout/TableComponent";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import {
  MODALIDADE_CURSO_EAD,
  MODALIDADE_CURSO_HIBRIDO,
  MODALIDADE_CURSO_PRESENCIAL,
  STATUS_CURSO_ATIVO,
  STATUS_CURSO_EM_REFORMULACAO,
  STATUS_CURSO_INATIVO,
  TIPO_CURSO_BACHARELADO,
  TIPO_CURSO_LICENCIATURA,
  TIPO_CURSO_POS_GRADUACAO,
  TIPO_CURSO_TECNICO,
  type CursoListItem,
} from "@/types";
import { api } from "@/utils/api";
import { Plus } from "lucide-react";
import { useState } from "react";

export default function CursosPage() {
  const { toast } = useToast();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCurso, setSelectedCurso] = useState<CursoListItem | null>(null);
  const [formData, setFormData] = useState<CourseFormData>({
    nome: "",
    codigo: "",
    tipo: "",
    modalidade: "",
    duracao: 8,
    cargaHoraria: 3000,
    descricao: "",
    departamentoId: "",
    coordenador: "",
    emailCoordenacao: "",
  });

  // Fetch courses and departments data
  const { data: cursosData, isLoading } = api.course.getCourses.useQuery({
    includeStats: true,
  });
  const { data: departamentosData } =
    api.departamento.getDepartamentos.useQuery({ includeStats: false });
  const apiUtils = api.useUtils();
  const createCursoMutation = api.course.createCourse.useMutation({
    onSuccess: () => {
      apiUtils.course.getCourses.invalidate();
    },
  });
  const updateCursoMutation = api.course.updateCourse.useMutation({
    onSuccess: () => {
      apiUtils.course.getCourses.invalidate();
    },
  });
  const deleteCursoMutation = api.course.deleteCourse.useMutation({
    onSuccess: () => {
      apiUtils.course.getCourses.invalidate();
    },
  });

  const departamentos = departamentosData || [];

  const cursos: CursoListItem[] =
    cursosData?.map((curso) => ({
      id: curso.id,
      nome: curso.nome,
      codigo: curso.codigo.toString(),
      tipo: curso.tipo || TIPO_CURSO_BACHARELADO,
      modalidade: curso.modalidade || MODALIDADE_CURSO_PRESENCIAL,
      duracao: curso.duracao || 8,
      cargaHoraria: curso.cargaHoraria,
      descricao: curso.descricao || undefined,
      departamento: {
        id: curso.departamentoId,
        nome:
          departamentos.find((d) => d.id === curso.departamentoId)?.nome ||
          "N/A",
        sigla:
          departamentos.find((d) => d.id === curso.departamentoId)?.sigla ||
          "N/A",
      },
      coordenador: curso.coordenador || undefined,
      emailCoordenacao: curso.emailCoordenacao || undefined,
      alunos: 0,
      disciplinas: 0,
      projetos: 0,
      status: (curso.status ||
        STATUS_CURSO_ATIVO) as typeof STATUS_CURSO_ATIVO | typeof STATUS_CURSO_INATIVO | typeof STATUS_CURSO_EM_REFORMULACAO,
      criadoEm: curso.createdAt.toISOString(),
      atualizadoEm:
        curso.updatedAt?.toISOString() || curso.createdAt.toISOString(),
    })) || [];

  const resetForm = () => {
    setFormData({
      nome: "",
      codigo: "",
      tipo: "",
      modalidade: "",
      duracao: 8,
      cargaHoraria: 3000,
      descricao: "",
      departamentoId: "",
      coordenador: "",
      emailCoordenacao: "",
    });
  };

  const handleCreate = async () => {
    try {
      if (
        !formData.nome ||
        !formData.codigo ||
        !formData.tipo ||
        !formData.modalidade ||
        !formData.departamentoId
      ) {
        toast({
          title: "Campos obrigatórios",
          description: "Por favor, preencha todos os campos obrigatórios",
          variant: "destructive",
        });
        return;
      }

      await createCursoMutation.mutateAsync({
        nome: formData.nome,
        codigo: parseInt(formData.codigo),
        tipo: formData.tipo,
        modalidade: formData.modalidade,
        duracao: formData.duracao,
        departamentoId: parseInt(formData.departamentoId),
        cargaHoraria: formData.cargaHoraria,
        descricao: formData.descricao || undefined,
        coordenador: formData.coordenador || undefined,
        emailCoordenacao: formData.emailCoordenacao || undefined,
      });

      toast({
        title: "Curso criado",
        description: `Curso ${formData.nome} criado com sucesso`,
      });

      setIsCreateDialogOpen(false);
      resetForm();
    } catch (error: any) {
      toast({
        title: "Erro ao criar curso",
        description: error.message || "Não foi possível criar o curso",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (curso: CursoListItem) => {
    setSelectedCurso(curso);
    setFormData({
      nome: curso.nome,
      codigo: curso.codigo,
      tipo: curso.tipo,
      modalidade: curso.modalidade,
      duracao: curso.duracao,
      cargaHoraria: curso.cargaHoraria,
      descricao: curso.descricao || "",
      departamentoId: curso.departamento.id.toString(),
      coordenador: curso.coordenador || "",
      emailCoordenacao: curso.emailCoordenacao || "",
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    try {
      if (
        !formData.nome ||
        !formData.codigo ||
        !formData.tipo ||
        !formData.modalidade ||
        !formData.departamentoId
      ) {
        toast({
          title: "Campos obrigatórios",
          description: "Por favor, preencha todos os campos obrigatórios",
          variant: "destructive",
        });
        return;
      }

      await updateCursoMutation.mutateAsync({
        id: selectedCurso!.id,
        nome: formData.nome,
        codigo: parseInt(formData.codigo),
        tipo: formData.tipo,
        modalidade: formData.modalidade,
        duracao: formData.duracao,
        departamentoId: parseInt(formData.departamentoId),
        cargaHoraria: formData.cargaHoraria,
        descricao: formData.descricao || undefined,
        coordenador: formData.coordenador || undefined,
        emailCoordenacao: formData.emailCoordenacao || undefined,
      });

      toast({
        title: "Curso atualizado",
        description: `Curso ${formData.nome} atualizado com sucesso`,
      });

      setIsEditDialogOpen(false);
      resetForm();
      setSelectedCurso(null);
    } catch (error: any) {
      toast({
        title: "Erro ao atualizar curso",
        description: error.message || "Não foi possível atualizar o curso",
        variant: "destructive",
      });
    }
  };

  const handleDeleteClick = (curso: CursoListItem) => {
    setSelectedCurso(curso);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    try {
      await deleteCursoMutation.mutateAsync({ id: selectedCurso!.id });

      toast({
        title: "Curso excluído",
        description: `Curso ${selectedCurso!.nome} excluído com sucesso`,
      });

      setIsDeleteDialogOpen(false);
      setSelectedCurso(null);
    } catch (error: any) {
      toast({
        title: "Erro ao excluir curso",
        description: error.message || "Não foi possível excluir o curso",
        variant: "destructive",
      });
    }
  };

  const columns = createCourseTableColumns({
    onEdit: handleEdit,
    onDelete: handleDeleteClick,
  });

  const totalCursos = cursos.length;
  const cursosAtivos = cursos.filter((c) => c.status === STATUS_CURSO_ATIVO).length;
  const totalAlunos = cursos.reduce((sum, c) => sum + c.alunos, 0);
  const totalDisciplinas = cursos.reduce((sum, c) => sum + c.disciplinas, 0);

  return (
    <PagesLayout
      title="Gerenciamento de Cursos"
      subtitle="Gerencie cursos e suas informações"
    >
      <div className="space-y-6">
        <CourseStatsCards
          totalCursos={totalCursos}
          cursosAtivos={cursosAtivos}
          totalAlunos={totalAlunos}
          totalDisciplinas={totalDisciplinas}
        />

        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Lista de Cursos</h2>

          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Curso
          </Button>
        </div>

        <TableComponent
          columns={columns}
          data={cursos}
          isLoading={isLoading}
          searchPlaceholder="Buscar cursos..."
        />

        <CourseFormDialog
          isOpen={isCreateDialogOpen}
          onOpenChange={(open) => {
            setIsCreateDialogOpen(open);
            if (!open) resetForm();
          }}
          formData={formData}
          setFormData={setFormData}
          departamentos={departamentos}
          onSubmit={handleCreate}
          isLoading={createCursoMutation.isPending}
          title="Criar Novo Curso"
          description="Preencha as informações do novo curso"
          submitLabel="Criar Curso"
        />

        <CourseFormDialog
          isOpen={isEditDialogOpen}
          onOpenChange={(open) => {
            setIsEditDialogOpen(open);
            if (!open) {
              setSelectedCurso(null);
              resetForm();
            }
          }}
          formData={formData}
          setFormData={setFormData}
          departamentos={departamentos}
          onSubmit={handleUpdate}
          isLoading={updateCursoMutation.isPending}
          title="Editar Curso"
          description="Atualize as informações do curso"
          submitLabel="Salvar Alterações"
        />

        <CourseDeleteDialog
          isOpen={isDeleteDialogOpen}
          onOpenChange={(open) => {
            setIsDeleteDialogOpen(open);
            if (!open) setSelectedCurso(null);
          }}
          curso={selectedCurso}
          onConfirm={handleDelete}
          isLoading={deleteCursoMutation.isPending}
        />
      </div>
    </PagesLayout>
  );
}
