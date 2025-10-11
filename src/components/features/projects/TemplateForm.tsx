"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Textarea } from "@/components/ui/textarea"
import { Loader2, Plus, Save, Settings, Trash2 } from "lucide-react"
import { UseFormReturn } from "react-hook-form"

interface TemplateFormProps {
  form: UseFormReturn<any>
  onSubmit: (data: any) => Promise<void>
  onCancel: () => void
  isSubmitting: boolean
  atividades: string[]
  onAtividadeChange: (index: number, value: string) => void
  onAddAtividade: () => void
  onRemoveAtividade: (index: number) => void
  publicoAlvoTipo: "estudantes_graduacao" | "outro"
  setPublicoAlvoTipo: (tipo: "estudantes_graduacao" | "outro") => void
  publicoAlvoCustom: string
  setPublicoAlvoCustom: (value: string) => void
}

export const TemplateForm: React.FC<TemplateFormProps> = ({
  form,
  onSubmit,
  onCancel,
  isSubmitting,
  atividades,
  onAtividadeChange,
  onAddAtividade,
  onRemoveAtividade,
  publicoAlvoTipo,
  setPublicoAlvoTipo,
  publicoAlvoCustom,
  setPublicoAlvoCustom,
}) => {
  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card className="border-amber-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <Settings className="h-5 w-5" />
              Configurações do Template Padrão
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="tituloDefault"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título Padrão</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Monitoria de Programação I"
                      value={field.value || ""}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="descricaoDefault"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição Padrão</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descrição padrão para projetos desta disciplina..."
                      rows={4}
                      value={field.value || ""}
                      onChange={field.onChange}
                      onBlur={field.onBlur}
                      name={field.name}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="cargaHorariaSemanaDefault"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Carga Horária Semanal</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                        onBlur={field.onBlur}
                        name={field.name}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="numeroSemanasDefault"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Número de Semanas</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        min={1}
                        value={field.value || ""}
                        onChange={(e) => field.onChange(parseInt(e.target.value) || undefined)}
                        onBlur={field.onBlur}
                        name={field.name}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="publicoAlvoDefault"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Público Alvo Padrão</FormLabel>
                  <FormControl>
                    <div className="space-y-4">
                      <RadioGroup
                        value={publicoAlvoTipo}
                        onValueChange={(value: "estudantes_graduacao" | "outro") => {
                          setPublicoAlvoTipo(value)
                          if (value === "estudantes_graduacao") {
                            field.onChange("Estudantes de graduação")
                          }
                        }}
                        className="flex flex-col space-y-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="estudantes_graduacao" id="estudantes_graduacao_template" />
                          <label
                            htmlFor="estudantes_graduacao_template"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Estudantes de graduação
                          </label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="outro" id="outro_template" />
                          <label
                            htmlFor="outro_template"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                          >
                            Outro
                          </label>
                        </div>
                      </RadioGroup>
                      {publicoAlvoTipo === "outro" && (
                        <div className="mt-3">
                          <Input
                            placeholder="Descreva o público alvo específico"
                            value={publicoAlvoCustom}
                            onChange={(e) => {
                              setPublicoAlvoCustom(e.target.value)
                              field.onChange(e.target.value)
                            }}
                          />
                        </div>
                      )}
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        {/* Atividades Padrão */}
        <Card className="border-amber-200">
          <CardHeader>
            <CardTitle className="text-amber-800">Atividades Padrão</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {atividades.map((atividade, index) => (
              <div key={index} className="flex items-center gap-2">
                <Input
                  placeholder={`Atividade padrão ${index + 1}`}
                  value={atividade}
                  onChange={(e) => onAtividadeChange(index, e.target.value)}
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onRemoveAtividade(index)}
                  disabled={atividades.length <= 1}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button type="button" variant="outline" onClick={onAddAtividade} className="w-full">
              <Plus className="h-4 w-4 mr-2" />
              Adicionar Atividade
            </Button>
          </CardContent>
        </Card>

        {/* Ações do Template */}
        <div className="flex justify-end space-x-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancelar
          </Button>
          <Button type="submit" disabled={isSubmitting} className="bg-amber-600 hover:bg-amber-700">
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Salvando...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Salvar Template
              </>
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}