"use client"

import {
  AdminProfile,
  DocumentsSection,
  PasswordManager,
  ProfessorProfile,
  StudentProfile,
  UserSignatureManager,
} from "@/components/features/profile"
import { PagesLayout } from "@/components/layout/PagesLayout"
import { Spinner } from "@/components/ui/spinner"
import { useAuth } from "@/hooks/use-auth"
import { ADMIN, PROFESSOR, STUDENT } from "@/types"

export default function ProfilePage() {
  const { user } = useAuth()

  if (!user) {
    return (
      <PagesLayout title="Perfil" subtitle="Carregando...">
        <div className="flex justify-center py-12">
          <Spinner />
        </div>
      </PagesLayout>
    )
  }

  if (user.role === STUDENT) {
    return (
      <PagesLayout title="Meu Perfil" subtitle="Gerencie suas informações pessoais">
        <div className="space-y-8">
          <StudentProfile />
          <DocumentsSection />
          <UserSignatureManager />
          <PasswordManager />
        </div>
      </PagesLayout>
    )
  }

  if (user.role === PROFESSOR) {
    return (
      <PagesLayout title="Meu Perfil" subtitle="Gerencie suas informações pessoais">
        <div className="space-y-8">
          <ProfessorProfile />
          <DocumentsSection />
          <UserSignatureManager />
          <PasswordManager />
        </div>
      </PagesLayout>
    )
  }

  return (
    <PagesLayout title="Perfil" subtitle="Perfil do administrador">
      <div className="space-y-8">
        <AdminProfile />
        <UserSignatureManager />
        <PasswordManager />
      </div>
    </PagesLayout>
  )
}
