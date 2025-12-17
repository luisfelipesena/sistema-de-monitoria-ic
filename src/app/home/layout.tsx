"use client"

import { Header } from "@/components/layout/Header"
import { SidebarLayout } from "@/components/layout/Sidebar"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"
import { useAuth } from "@/hooks/use-auth"
import { useOnboardingStatus } from "@/hooks/use-onboarding"
import { ADMIN, PROFESSOR, STUDENT, type UserRole } from "@/types"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useMemo } from "react"
import { Spinner } from "@/components/ui/spinner"

/**
 * Security: Validates that the current route matches user's role
 * Defense-in-depth: Even if middleware fails, this redirects unauthorized users
 */
function getRouteRole(pathname: string): UserRole | "common" | null {
  if (pathname.startsWith("/home/admin")) return ADMIN
  if (pathname.startsWith("/home/professor")) return PROFESSOR
  if (pathname.startsWith("/home/student")) return STUDENT
  if (pathname.startsWith("/home/common")) return "common"
  return null
}

function isAuthorizedForRoute(userRole: UserRole, routeRole: UserRole | "common" | null): boolean {
  if (routeRole === null) return true
  if (routeRole === "common") return true
  return userRole === routeRole
}

export default function HomeLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()
  const { data: onboardingStatus, isLoading: statusLoading } = useOnboardingStatus()

  const isOnboardingPage = pathname === "/home/common/onboarding"
  const routeRole = useMemo(() => getRouteRole(pathname), [pathname])

  useEffect(() => {
    if (!user && !isLoading) {
      router.push("/")
      return
    }

    if (isLoading || statusLoading || !user) {
      return
    }

    // Security: Redirect users trying to access unauthorized role routes
    if (!isAuthorizedForRoute(user.role as UserRole, routeRole)) {
      console.warn(`[Security] User ${user.id} (${user.role}) tried to access ${pathname}`)
      router.replace(getDashboardRoute(user.role))
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
  }, [user, isLoading, statusLoading, onboardingStatus, pathname, router, isOnboardingPage, routeRole])

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

  // Security: Block render if user is on unauthorized route (prevents flash of content)
  if (!isAuthorizedForRoute(user.role as UserRole, routeRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    )
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
