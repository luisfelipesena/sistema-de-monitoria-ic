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
      <div className="container flex items-center h-14">
        <Link to="/" className="flex items-center mr-6 space-x-2">
          <GraduationCap className="w-6 h-6" />
          <span className="font-bold sm:inline-block">Sistema de Monitoria do IC</span>
        </Link>

        {/* Right Side: Action Buttons */}
        <div className="flex items-center justify-end flex-1 space-x-4">
          <>
            <Button variant="ghost" onClick={() => navigate("/auth/sign-in")}>
              Login
            </Button>
            <Button variant="outline" onClick={() => navigate("/auth/sign-up")}>
              Registre-se
            </Button>
          </>
        </div>
      </div>
    </header>
  )
}
