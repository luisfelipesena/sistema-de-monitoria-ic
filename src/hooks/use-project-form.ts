import type { MonitoriaFormData } from '@/components/features/projects/MonitoriaFormTemplate';
import {
  defaultFormValues,
  projetoFormSchema,
  type ProjetoFormData,
} from '@/components/features/projects/types';
import { useAuth } from '@/hooks/use-auth';
import { useDepartamentoList } from '@/hooks/use-departamento';
import { useDisciplinas } from '@/hooks/use-disciplina';
import { useProfessores } from '@/hooks/use-professor';
import type { ProfessorResponse } from '@/routes/api/professor';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';

export function useProjectForm() {
  const { user } = useAuth();
  const { data: departamentos, isLoading: loadingDepartamentos } =
    useDepartamentoList();
  const { data: professores, isLoading: loadingProfessores } = useProfessores();

  // Set initial default values
  const initialValues = {
    ...defaultFormValues,
    // If admin user, set coordinator to admin username
    coordenadorResponsavel: user?.role === 'admin' ? user?.username : '',
  };

  const form = useForm<ProjetoFormData>({
    resolver: zodResolver(projetoFormSchema),
    defaultValues: initialValues,
  });

  const {
    register,
    control,
    watch,
    setValue,
    formState: { errors },
  } = form;

  const departamentoId = watch('departamentoId');
  const departamentoSelecionado = departamentos?.find(
    (d) => d.id === departamentoId,
  );
  const { data: disciplinasFiltradas, isLoading: loadingDisciplinas } =
    useDisciplinas(departamentoId);
  const formData = watch();

  const isLoading = loadingDepartamentos || loadingProfessores;
  const hasNoData = !departamentos || departamentos.length === 0;

  const createTemplateData = (): MonitoriaFormData | null => {
    if (!formData.titulo || !formData.descricao || !departamentoSelecionado) {
      return null;
    }

    const departamento = departamentoSelecionado;
    const disciplinasSelecionadas =
      disciplinasFiltradas?.filter((d) =>
        formData.disciplinaIds?.includes(d.id),
      ) || [];

    if (!departamento) return null;

    // Find professor responsible - if admin creating form, this is derived from disciplines
    let professorResponsavel;
    if (user?.role === 'admin') {
      if (
        disciplinasSelecionadas.length > 0 &&
        disciplinasSelecionadas[0].professorResponsavel
      ) {
        const professor = professores?.find(
          (p) =>
            p.nomeCompleto === disciplinasSelecionadas[0].professorResponsavel,
        );
        if (professor) {
          professorResponsavel = {
            id: professor.id,
            nomeCompleto: professor.nomeCompleto,
            nomeSocial: professor.nomeSocial || undefined,
            genero: professor.genero,
            cpf: professor.cpf,
            matriculaSiape: professor.matriculaSiape || undefined,
            regime: professor.regime,
            telefone: professor.telefone || undefined,
            telefoneInstitucional: professor.telefoneInstitucional || undefined,
            emailInstitucional: professor.emailInstitucional,
          };
        }
      }
    } else if (user?.role === 'professor') {
      // For professors, use their own info - find by userId instead of username
      const professor = professores?.find(
        (p) => p.userId === user.id,
      );
      if (professor) {
        professorResponsavel = {
          id: professor.id,
          nomeCompleto: professor.nomeCompleto,
          nomeSocial: professor.nomeSocial || undefined,
          genero: professor.genero,
          cpf: professor.cpf,
          matriculaSiape: professor.matriculaSiape || undefined,
          regime: professor.regime,
          telefone: professor.telefone || undefined,
          telefoneInstitucional: professor.telefoneInstitucional || undefined,
          emailInstitucional: professor.emailInstitucional,
        };
      }
    } else if (formData.professorResponsavelId) {
      // Fallback to manually selected professor
      const professor = professores?.find(
        (p) => p.id === formData.professorResponsavelId,
      );
      if (professor) {
        professorResponsavel = {
          id: professor.id,
          nomeCompleto: professor.nomeCompleto,
          nomeSocial: professor.nomeSocial || undefined,
          genero: professor.genero,
          cpf: professor.cpf,
          matriculaSiape: professor.matriculaSiape || undefined,
          regime: professor.regime,
          telefone: professor.telefone || undefined,
          telefoneInstitucional: professor.telefoneInstitucional || undefined,
          emailInstitucional: professor.emailInstitucional,
        };
      }
    }

    return {
      titulo: formData.titulo,
      descricao: formData.descricao,
      departamento,
      coordenadorResponsavel: formData.coordenadorResponsavel || '',
      professorResponsavel: professorResponsavel,
      ano: formData.ano || new Date().getFullYear(),
      semestre: formData.semestre || 'SEMESTRE_1',
      tipoProposicao: formData.tipoProposicao || 'INDIVIDUAL',
      bolsasSolicitadas: formData.bolsasSolicitadas || 0,
      voluntariosSolicitados: formData.voluntariosSolicitados || 0,
      cargaHorariaSemana: formData.cargaHorariaSemana || 4,
      numeroSemanas: formData.numeroSemanas || 16,
      publicoAlvo: formData.publicoAlvo || '',
      estimativaPessoasBenificiadas: formData.estimativaPessoasBenificiadas,
      disciplinas: disciplinasSelecionadas.map((d) => ({
        id: d.id,
        codigo: d.codigo,
        nome: d.nome,
      })),
      user: {
        username: user?.username,
        email: user?.email,
      },
    };
  };

  // Function to handle form submission - properly return a function that accepts a callback
  const handleFormSubmit = () => {
    // When admin creates project, we need to determine the professorResponsavelId from disciplines
    if (user?.role === 'admin' && formData.disciplinaIds.length > 0) {
      const disciplina = disciplinasFiltradas?.find(
        (d) => d.id === formData.disciplinaIds[0],
      );

      if (disciplina && disciplina.professorResponsavel) {
        const professor = professores?.find(
          (p) => p.nomeCompleto === disciplina.professorResponsavel,
        );

        if (professor) {
          setValue('professorResponsavelId', professor.id);
        }
      }
    }

    // Now return the handleSubmit function with the onValid callback
    return (onValid: (data: ProjetoFormData) => void) =>
      form.handleSubmit(onValid);
  };

  return {
    user,
    departamentos,
    professores,
    disciplinasFiltradas,
    formData,
    form,
    register,
    control,
    watch,
    setValue,
    errors,
    departamentoSelecionado,
    loadingDisciplinas,
    isLoading,
    hasNoData,
    createTemplateData,
    handleFormSubmit,
  };
}
