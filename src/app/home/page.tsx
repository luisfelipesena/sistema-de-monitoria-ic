"use client"

import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/hooks/use-auth"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

export default function HomePage() {
  const { user, isLoading } = useAuth()
  const router = useRouter()

  useEffect(() => {
    if (!isLoading && user) {
      const dashboardPath = `/home/${user.role}/dashboard`
      router.replace(dashboardPath)
    }
  }, [user, isLoading, router])

  return (
    <div className="min-h-screen flex items-center justify-center flex-col gap-4">
      <Spinner />
      <span className="text-sm text-center text-muted-foreground">Redirecionando para o dashboard...</span>
    </div>
  )
}
