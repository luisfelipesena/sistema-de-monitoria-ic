"use client"

import { Header } from "@/components/layout/Header"
import { SidebarLayout } from "@/components/layout/Sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { useAuth } from "@/hooks/use-auth"
import { useOnboardingStatus } from "@/hooks/use-onboarding"
import { PROFESSOR, STUDENT } from "@/types"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"
import { Spinner } from "@/components/ui/spinner"

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const { data: onboardingStatus, isLoading: statusLoading } = useOnboardingStatus()

  const isOnboardingPage = pathname === "/home/common/onboarding"

  useEffect(() => {
    if (!user && !isLoading) {
      router.push("/")
      return
    }

    if (isLoading || statusLoading || !user) {
      return
    }

    const needsOnboarding = onboardingStatus?.pending
    const isStudentOrProfessor = user.role === STUDENT || user.role === PROFESSOR

    if (needsOnboarding && isStudentOrProfessor && !isOnboardingPage) {
      router.push("/home/common/onboarding")
      return
    }

    if (!needsOnboarding && isOnboardingPage) {
      const dashboardRoute = getDashboardRoute(user.role)
      router.push(dashboardRoute)
      return
    }
  }, [user, isLoading, statusLoading, onboardingStatus, pathname, router, isOnboardingPage])

  if (isLoading || statusLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!user) {
    return null
  }

  const needsOnboarding = onboardingStatus?.pending
  const isStudentOrProfessor = user.role === STUDENT || user.role === PROFESSOR

  if (needsOnboarding && isStudentOrProfessor && !isOnboardingPage) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  return (
    <SidebarProvider>
      <SidebarLayout pathname={pathname} />

      <SidebarInset>
        <Header />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  )
}

function getDashboardRoute(role: string): string {
  return `/home/${role}/dashboard`
}
