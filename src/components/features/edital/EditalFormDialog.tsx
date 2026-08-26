import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { SEMESTRE_1, SEMESTRE_2, TIPO_EDITAL_DCC, TIPO_EDITAL_DCI, type Semestre, type TipoEdital } from "@/types";
import type { SlotDataHorario } from "@/types/selecao-inputs";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { useState } from "react";
import { UseFormReturn } from "react-hook-form";

/**
 * DatePicker com calendário popup.
 */
function DatePickerField({ value, onChange }: {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal h-10",
            !value && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "dd/MM/yyyy", { locale: ptBR }) : "Selecione a data"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={(date) => {
            onChange(date ?? undefined);
            setOpen(false);
          }}
          locale={ptBR}
        />
      </PopoverContent>
    </Popover>
  );
}

/**
 * DateTimePicker: calendário popup + seletor de hora.
 */
function DateTimePickerField({ value, onChange }: {
  value: Date | undefined;
  onChange: (date: Date | undefined) => void;
}) {
  const [open, setOpen] = useState(false);

  const handleDateSelect = (date: Date | undefined) => {
    if (!date) {
      onChange(undefined);
      return;
    }
    // Preservar a hora existente se já havia valor
    if (value) {
      date.setHours(value.getHours(), value.getMinutes());
    }
    onChange(date);
  };

  const handleTimeChange = (time: string) => {
    const [h, m] = time.split(":").map(Number);
    const newDate = value ? new Date(value) : new Date();
    newDate.setHours(h, m, 0, 0);
    onChange(newDate);
  };

  const currentTime = value
    ? `${String(value.getHours()).padStart(2, "0")}:${String(value.getMinutes()).padStart(2, "0")}`
    : "";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-full justify-start text-left font-normal h-10",
            !value && "text-muted-foreground"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {value ? format(value, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR }) : "Selecione data e hora"}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <Calendar
          mode="single"
          selected={value}
          onSelect={handleDateSelect}
          locale={ptBR}
        />
        <div className="border-t px-3 py-2">
          <label className="text-xs font-medium text-muted-foreground">Horário</label>
          <Select value={currentTime} onValueChange={handleTimeChange}>
            <SelectTrigger className="mt-1 h-9">
              <SelectValue placeholder="Selecione o horário" />
            </SelectTrigger>
            <SelectContent className="max-h-[200px]">
              {Array.from({ length: 48 }, (_, i) => {
                const h = String(Math.floor(i / 2)).padStart(2, "0");
                const m = i % 2 === 0 ? "00" : "30";
                const t = `${h}:${m}`;
                return <SelectItem key={t} value={t}>{t}</SelectItem>;
              })}
            </SelectContent>
          </Select>
        </div>
      </PopoverContent>
    </Popover>
  );
}

/**
 * TimePicker: dropdown de horários em intervalos de 30 min.
 */
function TimePickerField({ value, onChange }: {
  value: string;
  onChange: (time: string) => void;
}) {
  return (
    <Select value={value || undefined} onValueChange={onChange}>
      <SelectTrigger className="h-10">
        <SelectValue placeholder="Selecione o horário" />
      </SelectTrigger>
      <SelectContent className="max-h-[200px]">
        {Array.from({ length: 48 }, (_, i) => {
          const h = String(Math.floor(i / 2)).padStart(2, "0");
          const m = i % 2 === 0 ? "00" : "30";
          const t = `${h}:${m}`;
          return <SelectItem key={t} value={t}>{t}</SelectItem>;
        })}
      </SelectContent>
    </Select>
  );
}

export interface EditalFormData {
  tipo: TipoEdital;
  numeroEdital: string;
  titulo: string;
  descricaoHtml?: string;
  valorBolsa: string;
  ano: number;
  semestre: Semestre;
  // Datas de INSCRIÇÃO (obrigatórias)
  dataInicioInscricao: Date;
  dataFimInscricao: Date;
  // Datas de SELEÇÃO (obrigatórias)
  dataInicioSelecao: Date;
  dataFimSelecao: Date;
  // Range de horários para seleção (obrigatórios)
  horarioInicioSelecao: string;
  horarioFimSelecao: string;
  // Data de divulgação dos resultados (obrigatória)
  dataDivulgacaoResultado: Date;
  // Janela de abertura e fechamento do edital (obrigatório)
  dataInicioAlteracao: Date;
  dataFimAlteracao: Date;
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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

            {/* Janela de Abertura e Fechamento do Edital */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Janela de Abertura e Fechamento do Edital</h3>
              <p className="text-xs text-muted-foreground">
                Defina o período em que os professores podem criar, editar e submeter projetos.
                Fora deste período, apenas administradores poderão realizar alterações.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dataInicioAlteracao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Início da Janela</FormLabel>
                      <FormControl>
                        <DateTimePickerField
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="dataFimAlteracao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fim da Janela</FormLabel>
                      <FormControl>
                        <DateTimePickerField
                          value={field.value}
                          onChange={field.onChange}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </div>

            <Separator />

            {/* Período de Inscrição */}
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-muted-foreground">Período de Inscrição</h3>
              <p className="text-xs text-muted-foreground">
                Defina as datas de início e fim para os alunos realizarem suas inscrições
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dataInicioInscricao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Início da Inscrição</FormLabel>
                      <FormControl>
                        <DatePickerField
                          value={field.value}
                          onChange={(date) => {
                            field.onChange(date)
                            if (date) {
                              const newEnd = new Date(date)
                              newEnd.setDate(newEnd.getDate() + 7)
                              form.setValue("dataFimInscricao", newEnd)
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
                        <DatePickerField
                          value={field.value}
                          onChange={field.onChange}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="dataInicioSelecao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Data Início da Seleção</FormLabel>
                      <FormControl>
                        <DatePickerField
                          value={field.value}
                          onChange={field.onChange}
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
                        <DatePickerField
                          value={field.value}
                          onChange={field.onChange}
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="horarioInicioSelecao"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Horário Início</FormLabel>
                      <FormControl>
                        <TimePickerField
                          value={field.value || ""}
                          onChange={field.onChange}
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
                        <TimePickerField
                          value={field.value || ""}
                          onChange={field.onChange}
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
                      <DatePickerField
                        value={field.value}
                        onChange={field.onChange}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Resumo de erros gerais */}
            {Object.keys(form.formState.errors).length > 0 && (
              <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3">
                <p className="text-sm font-medium text-red-800">
                  Não foi possível salvar. Corrija os erros acima:
                </p>
                <ul className="mt-1.5 list-disc list-inside text-xs text-red-700 space-y-0.5">
                  {Object.entries(form.formState.errors).map(([key, error]) => (
                    <li key={key}>{(error as { message?: string })?.message || `Campo "${key}" inválido`}</li>
                  ))}
                </ul>
              </div>
            )}

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
