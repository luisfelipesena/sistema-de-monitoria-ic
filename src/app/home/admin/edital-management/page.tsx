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
import { api } from "@/utils/api";
import { getCurrentSemester } from "@/utils/utils";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus, Pencil } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";

const editalFormSchema = z
  .object({
    tipo: z.enum([TIPO_EDITAL_DCC, TIPO_EDITAL_DCI]),
    numeroEdital: z.string().min(1, "Número do edital é obrigatório"),
    titulo: z.string().min(1, "Título é obrigatório"),
    descricaoHtml: z.string().optional(),
    valorBolsa: z.string(),
    ano: z.number().int().min(2000).max(2100),
    semestre: z.enum([SEMESTRE_1, SEMESTRE_2]),
    // Datas de INSCRIÇÃO
    dataInicioInscricao: z.date(),
    dataFimInscricao: z.date(),
    // Datas de SELEÇÃO (prova) - opcionais
    dataInicioSelecao: z.date().optional(),
    dataFimSelecao: z.date().optional(),
    // Data divulgação
    dataDivulgacaoResultado: z.date().optional(),
  })
  .refine((data) => data.dataFimInscricao > data.dataInicioInscricao, {
    message: "Data fim de inscrição deve ser posterior à data início",
    path: ["dataFimInscricao"],
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

  const publishEditalMutation = api.edital.publishEdital.useMutation({
    onSuccess: () => {
      toast({
        title: "Sucesso!",
        description: "Edital publicado com sucesso!",
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
        description: data.message,
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
    defaultValues: {
      tipo: TIPO_EDITAL_DCC,
      numeroEdital: "",
      titulo: "Edital Interno de Seleção de Monitores",
      descricaoHtml: "",
      valorBolsa: "400.00",
      ano: currentYear,
      semestre: currentSemester,
      dataInicioInscricao: new Date(),
      dataFimInscricao: new Date(new Date().setDate(new Date().getDate() + 30)),
      dataInicioSelecao: undefined,
      dataFimSelecao: undefined,
      dataDivulgacaoResultado: undefined,
    },
  });

  const editForm = useForm<EditalFormData>({
    resolver: zodResolver(editalFormSchema),
    defaultValues: {
      tipo: TIPO_EDITAL_DCC,
      numeroEdital: "",
      titulo: "",
      descricaoHtml: "",
      valorBolsa: "400.00",
      ano: currentYear,
      semestre: currentSemester,
      dataInicioInscricao: new Date(),
      dataFimInscricao: new Date(new Date().setDate(new Date().getDate() + 30)),
      dataInicioSelecao: undefined,
      dataFimSelecao: undefined,
      dataDivulgacaoResultado: undefined,
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
      dataDivulgacaoResultado: data.dataDivulgacaoResultado,
      numeroEditalPrograd: data.numeroEditalPrograd,
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
      dataDivulgacaoResultado: data.dataDivulgacaoResultado,
      numeroEditalPrograd: data.numeroEditalPrograd,
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
    editForm.reset({
      tipo: (edital.tipo as typeof TIPO_EDITAL_DCC | typeof TIPO_EDITAL_DCI) || TIPO_EDITAL_DCC,
      numeroEdital: edital.numeroEdital,
      titulo: edital.titulo,
      descricaoHtml: edital.descricaoHtml || "",
      valorBolsa: "400.00",
      ano: edital.periodoInscricao?.ano || currentYear,
      semestre: edital.periodoInscricao?.semestre || currentSemester,
      dataInicioInscricao: edital.periodoInscricao?.dataInicio
        ? new Date(edital.periodoInscricao.dataInicio)
        : new Date(),
      dataFimInscricao: edital.periodoInscricao?.dataFim
        ? new Date(edital.periodoInscricao.dataFim)
        : new Date(),
      dataInicioSelecao: edital.dataInicioSelecao ? new Date(edital.dataInicioSelecao) : undefined,
      dataFimSelecao: edital.dataFimSelecao ? new Date(edital.dataFimSelecao) : undefined,
      dataDivulgacaoResultado: edital.dataDivulgacaoResultado
        ? new Date(edital.dataDivulgacaoResultado)
        : undefined,
      numeroEditalPrograd: edital.periodoInscricao?.numeroEditalPrograd || "",
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
