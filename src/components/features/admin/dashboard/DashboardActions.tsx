import { Button } from '@/components/ui/button'
import { Download, Filter, FileSignature, FolderKanban, User } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface DashboardActionsProps {
  abaAtiva: 'projetos' | 'professores' | 'alunos'
  groupedView: boolean
  activeFilters: number
  onToggleGroupedView: () => void
  onOpenFilters: () => void
}

export function DashboardActions({
  abaAtiva,
  groupedView,
  activeFilters,
  onToggleGroupedView,
  onOpenFilters,
}: DashboardActionsProps) {
  const router = useRouter()

  return (
    <div className="flex flex-wrap gap-2 sm:gap-3">
      {abaAtiva === 'projetos' && (
        <>
          <Button
            variant="outline"
            size="sm"
            className="text-purple-600 border-purple-600 hover:bg-purple-50 text-xs sm:text-sm px-2 sm:px-4"
            onClick={() => router.push('/home/admin/edital-management')}
          >
            <FileSignature className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Editais Internos</span>
            <span className="sm:hidden">Editais</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="text-green-600 border-green-600 hover:bg-green-50 text-xs sm:text-sm px-2 sm:px-4"
            onClick={() => router.push('/home/admin/planilha-prograd')}
          >
            <Download className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Planilha PROGRAD</span>
            <span className="sm:hidden">PROGRAD</span>
          </Button>
        </>
      )}
      {abaAtiva === 'professores' && (
        <Button
          variant="primary"
          size="sm"
          onClick={() => router.push('/home/admin/professores')}
          className="text-xs sm:text-sm px-2 sm:px-4"
        >
          <User className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Gerenciar Professores</span>
          <span className="sm:hidden">Gerenciar</span>
        </Button>
      )}
      {abaAtiva === 'alunos' && (
        <Button
          variant="primary"
          size="sm"
          onClick={() => router.push('/home/admin/alunos')}
          className="text-xs sm:text-sm px-2 sm:px-4"
        >
          <User className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Gerenciar Alunos</span>
          <span className="sm:hidden">Gerenciar</span>
        </Button>
      )}
      <Button
        variant={groupedView ? 'secondary' : 'outline'}
        size="sm"
        className="text-xs sm:text-sm px-2 sm:px-4"
        onClick={onToggleGroupedView}
      >
        <FolderKanban className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
        <span className="hidden sm:inline">{groupedView ? 'Visão Normal' : 'Agrupar por Departamento'}</span>
        <span className="sm:hidden">{groupedView ? 'Normal' : 'Agrupar'}</span>
      </Button>
      <Button
        variant="outline"
        size="sm"
        onClick={onOpenFilters}
        className="relative text-xs sm:text-sm px-2 sm:px-4"
      >
        <Filter className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
        Filtros
        {activeFilters > 0 && (
          <span className="absolute -top-1 -right-1 bg-blue-600 text-white sm:text-xs rounded-full px-1.5 sm:px-2 py-0.5">
            {activeFilters}
          </span>
        )}
      </Button>
    </div>
  )
}
