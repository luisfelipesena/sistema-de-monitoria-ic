import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { SEMESTRE_VALUES, type Semestre, getSemestreLabel } from "@/types"
import { Calendar, CheckCircle, Filter } from "lucide-react"

interface ConsolidacaoFiltersProps {
  selectedYear: number
  selectedSemester: Semestre
  incluirBolsistas: boolean
  incluirVoluntarios: boolean
  isLoading: boolean
  loadingValidation: boolean
  onYearChange: (year: string) => void
  onSemesterChange: (semester: Semestre) => void
  onIncluirBolsistasChange: (checked: boolean) => void
  onIncluirVoluntariosChange: (checked: boolean) => void
  onRefetch: () => void
  onValidate: () => void
}

export function ConsolidacaoFilters({
  selectedYear,
  selectedSemester,
  incluirBolsistas,
  incluirVoluntarios,
  isLoading,
  loadingValidation,
  onYearChange,
  onSemesterChange,
  onIncluirBolsistasChange,
  onIncluirVoluntariosChange,
  onRefetch,
  onValidate,
}: ConsolidacaoFiltersProps) {
  const currentYear = new Date().getFullYear()
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Filter className="h-5 w-5" />
          Filtros de Período
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="ano">Ano</Label>
            <Select value={selectedYear.toString()} onValueChange={onYearChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o ano" />
              </SelectTrigger>
              <SelectContent>
                {years.map((year) => (
                  <SelectItem key={year} value={year.toString()}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="semestre">Semestre</Label>
            <Select value={selectedSemester} onValueChange={onSemesterChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione o semestre" />
              </SelectTrigger>
              <SelectContent>
                {SEMESTRE_VALUES.map((semestre) => (
                  <SelectItem key={semestre} value={semestre}>
                    {getSemestreLabel(semestre)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Incluir na Exportação</Label>
            <div className="flex gap-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="bolsistas"
                  checked={incluirBolsistas}
                  onCheckedChange={(checked) => onIncluirBolsistasChange(Boolean(checked))}
                />
                <Label htmlFor="bolsistas">Bolsistas</Label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="voluntarios"
                  checked={incluirVoluntarios}
                  onCheckedChange={(checked) => onIncluirVoluntariosChange(Boolean(checked))}
                />
                <Label htmlFor="voluntarios">Voluntários</Label>
              </div>
            </div>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button onClick={onRefetch} disabled={isLoading} variant="outline">
            <Calendar className="h-4 w-4 mr-2" />
            Atualizar Dados
          </Button>
          <Button onClick={onValidate} disabled={loadingValidation} variant="outline">
            <CheckCircle className="h-4 w-4 mr-2" />
            Validar Dados
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
