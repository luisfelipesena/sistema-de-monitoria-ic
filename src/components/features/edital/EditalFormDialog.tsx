import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { SEMESTRE_1, SEMESTRE_2, TIPO_EDITAL_DCC, TIPO_EDITAL_DCI, type Semestre, type TipoEdital } from "@/types";
import type { SlotDataHorario } from "@/types/selecao-inputs";
import { UseFormReturn } from "react-hook-form";
import { SlotDateTimePicker } from "./SlotDateTimePicker";

export interface EditalFormData {
  tipo: TipoEdital;
  numeroEdital: string;
  titulo: string;
  descricaoHtml?: string;
  valorBolsa: string;
  ano: number;
  semestre: Semestre;
  // Datas de INSCRIÇÃO
  dataInicioInscricao: Date;
  dataFimInscricao: Date;
  // Datas de SELEÇÃO (range)
  dataInicioSelecao?: Date;
  dataFimSelecao?: Date;
  // Range de horários para seleção
  horarioInicioSelecao?: string;
  horarioFimSelecao?: string;
  // Data de divulgação dos resultados
  dataDivulgacaoResultado?: Date;
  // Edital PROGRAD
  numeroEditalPrograd?: string;
  // Datas disponíveis para provas (legacy, mantido para compatibilidade)
  datasProvasDisponiveis?: SlotDataHorario[];
}

interface EditalFormDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  form: UseFormReturn<EditalFormData>;
  onSubmit: (data: EditalFormData) => void;
  isLoading?: boolean;
  title: string;
  description: string;
  submitLabel: string;
}

export function EditalFormDialog({
  isOpen,
  onOpenChange,
  form,
  onSubmit,
  isLoading = false,
  title,
  description,
  submitLabel,
}: EditalFormDialogProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Informações Básicas */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Informações Básicas</h3>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="tipo"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Departamento</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o departamento" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={TIPO_EDITAL_DCC}>DCC (Ciência da Computação)</SelectItem>
                          <SelectItem value={TIPO_EDITAL_DCI}>DCI (Ciência da Informação)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="numeroEdital"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Número do Edital</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="Ex: 001/2024" />
                      </FormControl>
                      <FormDescription>
                        Pode ser editado posteriormente
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="numeroEditalPrograd"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nº Edital PROGRAD (opcional)</FormLabel>
                    <FormControl>
                      <Input {...field} value={field.value || ""} placeholder="Ex: 01/2026" />
                    </FormControl>
                    <FormDescription>
                      Número do edital PROGRAD associado a este semestre (aparece nos PDFs dos projetos)
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="titulo"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Título do Edital</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Ex: Edital de Monitoria 2024.1" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="descricaoHtml"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição (HTML)</FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        rows={4}
                        placeholder="Descrição completa do edital (suporta HTML)"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="ano"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Ano</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value))}
                          placeholder="2024"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="semestre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Semestre</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o semestre" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value={SEMESTRE_1}>1º Semestre</SelectItem>
                          <SelectItem value={SEMESTRE_2}>2º Semestre</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="valorBolsa"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Valor da Bolsa (R$)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        {...field}
                        placeholder="400.00"
                      />
                    </FormControl>
                    <FormDescription>
                      Este valor será utilizado nos Termos de Compromisso e Relatórios de Bolsistas, não aparecerá no PDF do edital
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator />

            {/* Período de Inscrição */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Período de Inscrição</h3>
              <p className="text-xs text-muted-foreground">
                Defina as datas de início e fim para os alunos realizarem suas inscrições
              </p>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dataInicioInscricao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Início da Inscrição</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={field.value?.toISOString().split("T")[0] || ""}
                          onChange={(e) => {
                            if (e.target.value) {
                              const newStart = new Date(e.target.value)
                              field.onChange(newStart)
                              const newEnd = new Date(newStart)
                              newEnd.setDate(newEnd.getDate() + 7)
                              form.setValue("dataFimInscricao", newEnd)
                            } else {
                              field.onChange(undefined)
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dataFimInscricao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Fim da Inscrição</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={field.value?.toISOString().split("T")[0] || ""}
                          onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Período de Seleção */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Período de Seleção (Prova)</h3>
              <p className="text-xs text-muted-foreground">
                Defina as datas de início e fim do período de seleção/provas (opcional)
              </p>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dataInicioSelecao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Início da Seleção</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={field.value?.toISOString().split("T")[0] || ""}
                          onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dataFimSelecao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Fim da Seleção</FormLabel>
                      <FormControl>
                        <Input
                          type="date"
                          value={field.value?.toISOString().split("T")[0] || ""}
                          onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Range de horários para seleção */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Horários Disponíveis para Seleção</h3>
              <p className="text-xs text-muted-foreground">
                Defina o range de horários em que os professores poderão agendar suas provas de seleção
              </p>
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="horarioInicioSelecao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horário Início</FormLabel>
                      <FormControl>
                        <input
                          type="time"
                          className="block w-full rounded-md px-3 py-2.5 text-sm transition-colors outline-none border bg-white h-[40px] border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value)}
                          disabled={isLoading}
                          aria-label="Horário início da seleção"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="horarioFimSelecao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horário Fim</FormLabel>
                      <FormControl>
                        <input
                          type="time"
                          className="block w-full rounded-md px-3 py-2.5 text-sm transition-colors outline-none border bg-white h-[40px] border-gray-300 focus:border-blue-600 focus:ring-2 focus:ring-blue-600"
                          value={field.value || ""}
                          onChange={(e) => field.onChange(e.target.value)}
                          disabled={isLoading}
                          aria-label="Horário fim da seleção"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Divulgação */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Divulgação</h3>
              <FormField
                control={form.control}
                name="dataDivulgacaoResultado"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Divulgação dos Resultados</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        value={field.value?.toISOString().split("T")[0] || ""}
                        onChange={(e) => field.onChange(e.target.value ? new Date(e.target.value) : undefined)}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Salvando..." : submitLabel}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
