"use client";

import {
  EditalFormData,
  EditalFormDialog,
} from "@/components/features/edital/EditalFormDialog";
import { EditalStatsCards } from "@/components/features/edital/EditalStatsCards";
import { createEditalTableColumns } from "@/components/features/edital/EditalTableColumns";
import { RequestChefeSignatureDialog } from "@/components/features/edital/RequestChefeSignatureDialog";
import { PagesLayout } from "@/components/layout/PagesLayout";
import { TableComponent } from "@/components/layout/TableComponent";
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
import { useEditalPdf } from "@/hooks/use-files";
import { useToast } from "@/hooks/use-toast";
import {
  EditalListItem,
  PERIODO_INSCRICAO_STATUS_ATIVO,
  SEMESTRE_1,
  SEMESTRE_2,
  TIPO_EDITAL_DCC,
  TIPO_EDITAL_DCI,
} from "@/types";
import type { SlotDataHorario } from "@/types/selecao-inputs";
import { api } from "@/utils/api";
import { getCurrentSemester } from "@/utils/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

/**
 * Parses the datasProvasDisponiveis JSON string from the edital response.
 * Supports both new format (array of objects) and legacy format (array of strings).
 */
function parseSlotsFromString(raw: string | null | undefined): SlotDataHorario[] {
  if (!raw) return [{ data: "", horario: "" }, { data: "", horario: "" }]

  try {
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return [{ data: "", horario: "" }, { data: "", horario: "" }]
    if (parsed.length === 0) return [{ data: "", horario: "" }, { data: "", horario: "" }]

    // Legacy format: array of strings
    if (typeof parsed[0] === 'string') {
      return parsed.map((s: string) => {
        const [data, horario] = s.split(' ')
        return { data: data || '', horario: horario || '' }
      })
    }

    // New format: array of objects
    return parsed.filter((s: unknown) => {
      if (typeof s !== 'object' || s === null) return false
      const slot = s as Record<string, unknown>
      return typeof slot.data === 'string' && typeof slot.horario === 'string'
    }) as SlotDataHorario[]
  } catch {
    return [{ data: "", horario: "" }, { data: "", horario: "" }]
  }
}

const editalFormSchema = z
  .object({
    tipo: z.enum([TIPO_EDITAL_DCC, TIPO_EDITAL_DCI]),
    numeroEdital: z.string().min(1, "Número do edital é obrigatório"),
    titulo: z.string().min(1, "Título é obrigatório"),
    descricaoHtml: z.string().optional(),
    ano: z.number().int().min(2000).max(2100),
    semestre: z.enum([SEMESTRE_1, SEMESTRE_2]),
    // Datas de INSCRIÇÃO
    dataInicioInscricao: z.date({ required_error: 'Data de início da inscrição é obrigatória' }),
    dataFimInscricao: z.date({ required_error: 'Data de fim da inscrição é obrigatória' }),
    // Datas de SELEÇÃO (range)
    dataInicioSelecao: z.date({ required_error: 'Data de início da seleção é obrigatória' }),
    dataFimSelecao: z.date({ required_error: 'Data de fim da seleção é obrigatória' }),
    // Range de horários para seleção
    horarioInicioSelecao: z.string({ required_error: 'Horário de início é obrigatório' }).regex(/^\d{2}:\d{2}$/, 'Horário inválido'),
    horarioFimSelecao: z.string({ required_error: 'Horário de fim é obrigatório' }).regex(/^\d{2}:\d{2}$/, 'Horário inválido'),
    // Data divulgação
    dataDivulgacaoResultado: z.date({ required_error: 'Data de divulgação é obrigatória' }),
    // Janela de abertura e fechamento do edital
    dataInicioAlteracao: z.date({ required_error: 'Data de início da janela é obrigatória' }),
    dataFimAlteracao: z.date({ required_error: 'Data de fim da janela é obrigatória' }),
    valorBolsa: z
      .string()
      .refine(
        (value) => {
          const normalized = value.replace(',', '.').trim()
          const parsed = Number(normalized)
          return normalized.length > 0 && !Number.isNaN(parsed) && parsed >= 0
        },
        {
          message: 'Valor da bolsa deve ser um número válido e não pode ser negativo',
        }
      ),
    // Legacy: datas disponíveis para provas
    datasProvasDisponiveis: z.array(z.object({ data: z.string(), horario: z.string() })).default([]),
  })
  .superRefine((data, ctx) => {
    // Helper: extrai só a parte da data (YYYY-MM-DD) para comparação sem hora
    const toDateOnly = (d: Date) => {
      if (!(d instanceof Date) || isNaN(d.getTime())) return 0
      return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
    }

    const fimAlteracao = toDateOnly(data.dataFimAlteracao)
    const inicioInscricao = toDateOnly(data.dataInicioInscricao)
    const fimInscricao = toDateOnly(data.dataFimInscricao)
    const inicioSelecao = toDateOnly(data.dataInicioSelecao)
    const fimSelecao = toDateOnly(data.dataFimSelecao)
    const divulgacao = toDateOnly(data.dataDivulgacaoResultado)

    if (fimAlteracao && inicioInscricao && fimAlteracao > inicioInscricao) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "O fim da janela de alteração deve ser anterior ou igual ao início das inscrições",
        path: ["dataFimAlteracao"],
      });
    }

    if (fimInscricao && inicioInscricao && fimInscricao <= inicioInscricao) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Data fim de inscrição deve ser posterior à data início",
        path: ["dataFimInscricao"],
      });
    }

    if (inicioSelecao && fimInscricao && inicioSelecao <= fimInscricao) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Data de início da seleção deve ser posterior ao fim da inscrição",
        path: ["dataInicioSelecao"],
      });
    }

    if (fimSelecao && inicioSelecao && fimSelecao < inicioSelecao) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Data fim de seleção deve ser posterior ou igual à data início",
        path: ["dataFimSelecao"],
      });
    }

    if (divulgacao && fimSelecao && divulgacao < fimSelecao) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Data de divulgação deve ser posterior ou igual ao fim da seleção",
        path: ["dataDivulgacaoResultado"],
      });
    }
  });

export default function EditalManagementPage() {
  const { toast } = useToast();
  const { year: currentYear, semester: currentSemester } = getCurrentSemester();

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isSignatureDialogOpen, setIsSignatureDialogOpen] = useState(false);
  const [isEditNumeroDialogOpen, setIsEditNumeroDialogOpen] = useState(false);
  const [selectedEdital, setSelectedEdital] = useState<EditalListItem | null>(null);
  const [numeroEditalEdit, setNumeroEditalEdit] = useState("");
  const [uploadFile, setUploadFile] = useState<File | null>(null);

  const { data: editais, isLoading, refetch } = api.edital.getEditais.useQuery();

  const createEditalMutation = api.edital.createEdital.useMutation({
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Edital criado com sucesso!",
      });
      setIsCreateDialogOpen(false);
      refetch();
      createForm.reset();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateEditalMutation = api.edital.updateEdital.useMutation({
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Edital atualizado com sucesso!",
      });
      setIsEditDialogOpen(false);
      setSelectedEdital(null);
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const updateNumeroEditalMutation = api.edital.updateNumeroEdital.useMutation({
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Número do edital atualizado!",
      });
      setIsEditNumeroDialogOpen(false);
      setSelectedEdital(null);
      setNumeroEditalEdit("");
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const deleteEditalMutation = api.edital.deleteEdital.useMutation({
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Edital excluído com sucesso!",
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const publishEditalMutation = api.edital.publishAndNotify.useMutation({
    onSuccess: (data) => {
      toast({
        title: "✅ Edital publicado com sucesso!",
        description: (
          <div className="space-y-2">
            <p>
              Os emails de notificação foram enviados com sucesso.
            </p>
            <p className="text-sm text-muted-foreground">
              {data.emailsSent} notificação(ões) enviada(s) para:{" "}
              {data.emailsUsados.join(", ")}
            </p>
          </div>
        ),
      });
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const uploadSignedMutation = api.edital.uploadSignedEdital.useMutation({
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Edital assinado carregado com sucesso!",
      });
      setUploadFile(null);
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Erro",
        description: `Erro: ${error.message}`,
        variant: "destructive",
      });
    },
  });

  const requestChefeSignatureMutation = api.edital.requestChefeSignature.useMutation({
    onSuccess: (data) => {
      toast({
        title: "Link de assinatura enviado!",
        description: (
          <div className="space-y-2">
            <p>{data.message}</p>
            {data.link && (
              <p className="text-xs font-mono break-all mt-1">
                Link direto:{" "}
                <a href={data.link} target="_blank" rel="noreferrer" className="underline text-blue-600 font-bold">
                  {data.link}
                </a>
              </p>
            )}
          </div>
        ),
      });
      setIsSignatureDialogOpen(false);
      setSelectedEdital(null);
      refetch();
    },
    onError: (error) => {
      toast({
        title: "Erro ao enviar solicitação",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const uploadFileMutation = api.file.uploadFile.useMutation();
  const generatePdfMutation = useEditalPdf();

  const createForm = useForm<EditalFormData>({
    resolver: zodResolver(editalFormSchema),
    mode: "onSubmit",
    defaultValues: {
      tipo: TIPO_EDITAL_DCC,
      numeroEdital: "",
      titulo: "Edital Interno de Seleção de Monitores",
      descricaoHtml: "",
      valorBolsa: "400.00",
      ano: currentYear,
      semestre: currentSemester,
      dataInicioInscricao: new Date(),
      dataFimInscricao: new Date(new Date().setDate(new Date().getDate() + 7)),
      dataInicioSelecao: undefined,
      dataFimSelecao: undefined,
      dataDivulgacaoResultado: undefined,
      horarioInicioSelecao: "08:00",
      horarioFimSelecao: "18:00",
      datasProvasDisponiveis: [],
    },
  });

  const editForm = useForm<EditalFormData>({
    resolver: zodResolver(editalFormSchema),
    mode: "onSubmit",
    defaultValues: {
      tipo: TIPO_EDITAL_DCC,
      numeroEdital: "",
      titulo: "",
      descricaoHtml: "",
      valorBolsa: "400.00",
      ano: currentYear,
      semestre: currentSemester,
      dataInicioInscricao: new Date(),
      dataFimInscricao: new Date(new Date().setDate(new Date().getDate() + 7)),
      dataInicioSelecao: undefined,
      dataFimSelecao: undefined,
      dataDivulgacaoResultado: undefined,
      horarioInicioSelecao: "08:00",
      horarioFimSelecao: "18:00",
      datasProvasDisponiveis: [],
    },
  });

  const handleCreate = (data: EditalFormData) => {
    createEditalMutation.mutate({
      tipo: data.tipo,
      numeroEdital: data.numeroEdital,
      titulo: data.titulo,
      descricaoHtml: data.descricaoHtml,
      valorBolsa: data.valorBolsa,
      ano: data.ano,
      semestre: data.semestre,
      dataInicioInscricao: data.dataInicioInscricao,
      dataFimInscricao: data.dataFimInscricao,
      dataInicioSelecao: data.dataInicioSelecao,
      dataFimSelecao: data.dataFimSelecao,
      horarioInicioSelecao: data.horarioInicioSelecao,
      horarioFimSelecao: data.horarioFimSelecao,
      dataDivulgacaoResultado: data.dataDivulgacaoResultado,
      dataInicioAlteracao: data.dataInicioAlteracao,
      dataFimAlteracao: data.dataFimAlteracao,
      numeroEditalPrograd: data.numeroEditalPrograd,
      datasProvasDisponiveis: data.datasProvasDisponiveis,
    });
  };

  const handleEdit = (data: EditalFormData) => {
    if (!selectedEdital) return;
    updateEditalMutation.mutate({
      id: selectedEdital.id,
      numeroEdital: data.numeroEdital,
      titulo: data.titulo,
      descricaoHtml: data.descricaoHtml,
      valorBolsa: data.valorBolsa,
      ano: data.ano,
      semestre: data.semestre,
      dataInicioInscricao: data.dataInicioInscricao,
      dataFimInscricao: data.dataFimInscricao,
      dataInicioSelecao: data.dataInicioSelecao,
      dataFimSelecao: data.dataFimSelecao,
      horarioInicioSelecao: data.horarioInicioSelecao,
      horarioFimSelecao: data.horarioFimSelecao,
      dataDivulgacaoResultado: data.dataDivulgacaoResultado,
      dataInicioAlteracao: data.dataInicioAlteracao,
      dataFimAlteracao: data.dataFimAlteracao,
      numeroEditalPrograd: data.numeroEditalPrograd,
      datasProvasDisponiveis: data.datasProvasDisponiveis,
    });
  };

  const handleEditNumero = () => {
    if (!selectedEdital || !numeroEditalEdit.trim()) return;
    updateNumeroEditalMutation.mutate({
      id: selectedEdital.id,
      numeroEdital: numeroEditalEdit,
    });
  };

  const handleDelete = (id: number) => {
    if (
      confirm(
        "Tem certeza que deseja excluir este edital? Esta ação excluirá também o período de inscrição associado."
      )
    ) {
      deleteEditalMutation.mutate({ id });
    }
  };

  const handlePublish = (id: number) => {
    publishEditalMutation.mutate({ id });
  };

  const handleUploadSigned = async (editalId: number) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "application/pdf";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const fileData = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const base64 = reader.result as string;
            resolve(base64.split(",")[1]);
          };
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });

        const uploadResult = await uploadFileMutation.mutateAsync({
          fileName: file.name,
          fileData,
          mimeType: file.type,
          entityType: "edital",
          entityId: editalId.toString(),
        });

        await uploadSignedMutation.mutateAsync({
          id: editalId,
          fileId: uploadResult.fileId,
        });
      } catch (error) {
        console.error("Error uploading signed edital:", error);
      }
    };
    input.click();
  };

  const handleViewPdf = async (editalId: number) => {
    try {
      const result = await generatePdfMutation.mutateAsync({ id: editalId });
      window.open(result.url, "_blank", "noopener,noreferrer");
      toast({
        title: "Sucesso!",
        description: "PDF do edital aberto em nova aba",
      });
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao gerar PDF do edital",
        variant: "destructive",
      });
      console.error("Error generating PDF:", error);
    }
  };

  const handleRequestChefeSignature = (edital: EditalListItem) => {
    setSelectedEdital(edital);
    setIsSignatureDialogOpen(true);
  };

  const handleConfirmSignatureRequest = async (chefeEmail: string, chefeNome?: string) => {
    if (!selectedEdital) return;
    await requestChefeSignatureMutation.mutateAsync({
      id: selectedEdital.id,
      chefeEmail,
      chefeNome,
    });
  };

  const openEditDialog = (edital: EditalListItem) => {
    setSelectedEdital(edital);

    // Helper para converter datas vindas do servidor (date-only columns stored as midnight UTC)
    // para Date local sem shift de dia por timezone.
    // Usa getters UTC para extrair ano/mês/dia corretos e reconstrói como data local ao meio-dia.
    const toLocalDate = (d: Date | string | null | undefined): Date | undefined => {
      if (!d) return undefined
      const date = d instanceof Date ? d : new Date(d)
      return new Date(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate(), 12, 0, 0)
    }

    editForm.reset({
      tipo: (edital.tipo as typeof TIPO_EDITAL_DCC | typeof TIPO_EDITAL_DCI) || TIPO_EDITAL_DCC,
      numeroEdital: edital.numeroEdital,
      titulo: edital.titulo,
      descricaoHtml: edital.descricaoHtml || "",
      valorBolsa: edital.valorBolsa || "400.00",
      ano: edital.periodoInscricao?.ano || currentYear,
      semestre: edital.periodoInscricao?.semestre || currentSemester,
      dataInicioInscricao: toLocalDate(edital.periodoInscricao?.dataInicio) || new Date(),
      dataFimInscricao: toLocalDate(edital.periodoInscricao?.dataFim) || new Date(),
      dataInicioSelecao: toLocalDate(edital.dataInicioSelecao),
      dataFimSelecao: toLocalDate(edital.dataFimSelecao),
      horarioInicioSelecao: edital.horarioInicioSelecao || "08:00",
      horarioFimSelecao: edital.horarioFimSelecao || "18:00",
      dataDivulgacaoResultado: toLocalDate(edital.dataDivulgacaoResultado),
      dataInicioAlteracao: toLocalDate(edital.dataInicioAlteracao),
      dataFimAlteracao: toLocalDate(edital.dataFimAlteracao),
      numeroEditalPrograd: edital.periodoInscricao?.numeroEditalPrograd || "",
      datasProvasDisponiveis: parseSlotsFromString(edital.datasProvasDisponiveis),
    });
    setIsEditDialogOpen(true);
  };

  const openEditNumeroDialog = (edital: EditalListItem) => {
    setSelectedEdital(edital);
    setNumeroEditalEdit(edital.numeroEdital);
    setIsEditNumeroDialogOpen(true);
  };

  const columns = createEditalTableColumns({
    onEdit: openEditDialog,
    onEditNumero: openEditNumeroDialog,
    onDelete: handleDelete,
    onViewPdf: handleViewPdf,
    onPublish: handlePublish,
    onRequestSignature: handleRequestChefeSignature,
    onUploadSigned: handleUploadSigned,
  });

  const editaisList = editais || [];
  const totalEditais = editaisList.length;
  const editaisAtivos = editaisList.filter(
    (e) => e.periodoInscricao?.status === PERIODO_INSCRICAO_STATUS_ATIVO
  ).length;
  const editaisPublicados = editaisList.filter((e) => e.publicado).length;
  const editaisAssinados = editaisList.filter((e) => e.chefeAssinouEm).length;

  return (
    <PagesLayout
      title="Gerenciamento de Editais"
      subtitle="Gerencie os editais de monitoria do departamento"
    >
      <div className="space-y-6">
        <EditalStatsCards
          totalEditais={totalEditais}
          editaisAtivos={editaisAtivos}
          editaisPublicados={editaisPublicados}
          editaisAssinados={editaisAssinados}
        />

        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Lista de Editais</h2>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Novo Edital
          </Button>
        </div>

        <TableComponent
          columns={columns}
          data={editaisList}
          isLoading={isLoading}
          searchPlaceholder="Buscar editais..."
        />

        <EditalFormDialog
          isOpen={isCreateDialogOpen}
          onOpenChange={setIsCreateDialogOpen}
          form={createForm}
          onSubmit={handleCreate}
          isLoading={createEditalMutation.isPending}
          title="Criar Novo Edital"
          description="Preencha as informações para criar um novo edital"
          submitLabel="Criar Edital"
        />

        <EditalFormDialog
          isOpen={isEditDialogOpen}
          onOpenChange={(open) => {
            setIsEditDialogOpen(open);
            if (!open) setSelectedEdital(null);
          }}
          form={editForm}
          onSubmit={handleEdit}
          isLoading={updateEditalMutation.isPending}
          title="Editar Edital"
          description="Atualize as informações do edital"
          submitLabel="Salvar Alterações"
        />

        {/* Dialog para editar apenas o número do edital */}
        <Dialog open={isEditNumeroDialogOpen} onOpenChange={setIsEditNumeroDialogOpen}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Editar Número do Edital</DialogTitle>
              <DialogDescription>
                Altere apenas o número do edital sem modificar outras informações.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="numeroEdital">Número do Edital</Label>
                <Input
                  id="numeroEdital"
                  value={numeroEditalEdit}
                  onChange={(e) => setNumeroEditalEdit(e.target.value)}
                  placeholder="Ex: 001/2024"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setIsEditNumeroDialogOpen(false);
                  setSelectedEdital(null);
                  setNumeroEditalEdit("");
                }}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleEditNumero}
                disabled={updateNumeroEditalMutation.isPending || !numeroEditalEdit.trim()}
              >
                {updateNumeroEditalMutation.isPending ? "Salvando..." : "Salvar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <RequestChefeSignatureDialog
          open={isSignatureDialogOpen}
          onOpenChange={(open) => {
            setIsSignatureDialogOpen(open);
            if (!open) setSelectedEdital(null);
          }}
          editalNumero={selectedEdital?.numeroEdital || ""}
          editalTitulo={selectedEdital?.titulo || ""}
          onConfirm={handleConfirmSignatureRequest}
          isLoading={requestChefeSignatureMutation.isPending}
        />
      </div>
    </PagesLayout>
  );
}
