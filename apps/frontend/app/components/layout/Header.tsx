import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { GraduationCap } from "lucide-react"
import { Link, useNavigate } from "react-router"

export function Header(p: { className?: string }) {
  const navigate = useNavigate()

  return (
    <header
      className={cn(
        "sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        p.className
      )}
    >
      <div className="container flex h-14 items-center">
        <Link to="/" className="mr-6 flex items-center space-x-2">
          <GraduationCap className="h-6 w-6" />
          <span className="font-bold sm:inline-block">Sistema de Monitoria do IC</span>
        </Link>

        {/* Right Side: Action Buttons */}
        <div className="flex flex-1 items-center justify-end space-x-4">
          <>
            <Button variant="ghost" onClick={() => navigate("/login")}>
              Login
            </Button>
            <Button variant="outline" onClick={() => navigate("/register")}>
              Registre-se
            </Button>
          </>
        </div>
      </div>
    </header>
  )
}
