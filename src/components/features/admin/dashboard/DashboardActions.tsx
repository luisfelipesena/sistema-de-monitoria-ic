import { Button } from "@/components/ui/button"
import { FileText, User } from "lucide-react"
import { useRouter } from "next/navigation"

interface DashboardActionsProps {
  abaAtiva: "projetos" | "professores" | "alunos"
}

export function DashboardActions({ abaAtiva }: DashboardActionsProps) {
  const router = useRouter()

  return (
    <div className="flex flex-wrap gap-2 sm:gap-3">
      {abaAtiva === "projetos" && (
        <Button
          variant="primary"
          size="sm"
          onClick={() => router.push("/home/admin/manage-projects")}
          className="text-xs sm:text-sm px-2 sm:px-4"
        >
          <FileText className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Gerenciar Projetos</span>
          <span className="sm:hidden">Projetos</span>
        </Button>
      )}
      {abaAtiva === "professores" && (
        <Button
          variant="primary"
          size="sm"
          onClick={() => router.push("/home/admin/professores")}
          className="text-xs sm:text-sm px-2 sm:px-4"
        >
          <User className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Gerenciar Professores</span>
          <span className="sm:hidden">Professores</span>
        </Button>
      )}
      {abaAtiva === "alunos" && (
        <Button
          variant="primary"
          size="sm"
          onClick={() => router.push("/home/admin/alunos")}
          className="text-xs sm:text-sm px-2 sm:px-4"
        >
          <User className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
          <span className="hidden sm:inline">Gerenciar Alunos</span>
          <span className="sm:hidden">Alunos</span>
        </Button>
      )}
    </div>
  )
}
