"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { projectFormSchema, SEMESTRE_1, SEMESTRE_2 } from "@/types"
import { Plus, Trash2 } from "lucide-react"
import { UseFormReturn } from "react-hook-form"
import { z } from "zod"

type ProjetoFormData = z.infer<typeof projectFormSchema>

interface ProjectFormFieldsProps {
  form: UseFormReturn<ProjetoFormData>
  departamentos?: Array<{ id: number; nome: string }>
  disciplinas?: Array<{ id: number; nome: string; departamentoId: number | null }>
  atividades: string[]
  onAtividadeChange: (index: number, value: string) => void
  onAddAtividade: () => void
  onRemoveAtividade: (index: number) => void
  publicoAlvoTipo: "estudantes_graduacao" | "outro"
  setPublicoAlvoTipo: (value: "estudantes_graduacao" | "outro") => void
  publicoAlvoCustom: string
  setPublicoAlvoCustom: (value: string) => void
  isEditMode?: boolean
}

export function ProjectFormFields({
  form,
  departamentos,
  disciplinas,
  atividades,
  onAtividadeChange,
  onAddAtividade,
  onRemoveAtividade,
  publicoAlvoTipo,
  setPublicoAlvoTipo,
  publicoAlvoCustom,
  setPublicoAlvoCustom,
  isEditMode = false,
}: ProjectFormFieldsProps) {
  const departamentoSelecionado = form.watch("departamentoId")
  const disciplinasFiltradas = disciplinas?.filter((d) => d.departamentoId === departamentoSelecionado)

  return (
    <>
      {/* Identificação do Projeto */}
      <Card>
        <CardHeader>
          <CardTitle>Identificação do Projeto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormField
            control={form.control}
            name="titulo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Título do Projeto</FormLabel>
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
            name="descricao"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição / Objetivos</FormLabel>
                <FormControl>
                  <Textarea
                    placeholder="Descrição detalhada do projeto..."
                    rows={6}
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
              name="departamentoId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Departamento</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      field.onChange(parseInt(value))
                      form.setValue("disciplinas", [])
                    }}
                    value={field.value?.toString()}
                    disabled={isEditMode}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o departamento" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {departamentos?.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id.toString()}>
                          {dept.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="disciplinas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Disciplinas</FormLabel>
                  <Select
                    onValueChange={(value) => {
                      const currentValues = field.value || []
                      const newId = parseInt(value)
                      if (!currentValues.includes(newId)) {
                        field.onChange([...currentValues, newId])
                      }
                    }}
                    disabled={!departamentoSelecionado || isEditMode}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Adicionar disciplina" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {disciplinasFiltradas?.map((disc) => (
                        <SelectItem key={disc.id} value={disc.id.toString()}>
                          {disc.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {(field.value || []).map((discId) => {
                      const disc = disciplinas?.find((d) => d.id === discId)
                      if (!disc) return null
                      return (
                        <div
                          key={discId}
                          className="flex items-center gap-1 bg-blue-100 text-blue-800 px-2 py-1 rounded text-sm"
                        >
                          {disc.nome}
                          {!isEditMode && (
                            <button
                              type="button"
                              onClick={() => {
                                const newValues = (field.value || []).filter((id) => id !== discId)
                                field.onChange(newValues)
                              }}
                              className="ml-1 text-blue-600 hover:text-blue-800"
                            >
                              ×
                            </button>
                          )}
                        </div>
                      )
                    })}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField
              control={form.control}
              name="ano"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ano</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={2024}
                      max={2030}
                      value={field.value}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
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
              name="semestre"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Semestre</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
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

            <FormField
              control={form.control}
              name="tipoProposicao"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Tipo</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="INDIVIDUAL">Individual</SelectItem>
                      <SelectItem value="COLETIVA">Coletiva</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          {form.watch("tipoProposicao") === "COLETIVA" && (
            <div className="space-y-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <h4 className="font-semibold text-blue-800">Projeto Coletivo</h4>
              <FormField
                control={form.control}
                name="professoresParticipantes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Professores Participantes</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Ex: 2 - Professor João Silva e Professora Maria Santos"
                        rows={2}
                        value={field.value || ""}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        name={field.name}
                      />
                    </FormControl>
                    <FormMessage />
                    <p className="text-sm text-blue-600">Informe o número e nome dos professores participantes</p>
                  </FormItem>
                )}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Detalhes do Projeto */}
      <Card>
        <CardHeader>
          <CardTitle>Detalhes do Projeto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="cargaHorariaSemana"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Carga Horária Semanal (horas)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      value={field.value}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
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
              name="numeroSemanas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número de Semanas</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      value={field.value}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
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
            name="publicoAlvo"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Público Alvo</FormLabel>
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
                        <RadioGroupItem value="estudantes_graduacao" id="estudantes_graduacao" />
                        <label
                          htmlFor="estudantes_graduacao"
                          className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                        >
                          Estudantes de graduação
                        </label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="outro" id="outro" />
                        <label
                          htmlFor="outro"
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

          <FormField
            control={form.control}
            name="estimativaPessoasBenificiadas"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estimativa de Pessoas Beneficiadas</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    min={0}
                    value={field.value || 0}
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                    onBlur={field.onBlur}
                    name={field.name}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </CardContent>
      </Card>

      {/* Vagas */}
      <Card>
        <CardHeader>
          <CardTitle>Vagas Solicitadas</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="bolsasSolicitadas"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bolsistas Solicitados</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      value={field.value || 0}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
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
              name="voluntariosSolicitados"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Voluntários Solicitados</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={0}
                      value={field.value || 0}
                      onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                      onBlur={field.onBlur}
                      name={field.name}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
        </CardContent>
      </Card>

      {/* Atividades */}
      <Card>
        <CardHeader>
          <CardTitle>Atividades do Projeto</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {atividades.map((atividade, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                placeholder={`Atividade ${index + 1}`}
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
    </>
  )
}
