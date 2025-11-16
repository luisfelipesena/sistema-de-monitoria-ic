'use client'

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Spinner } from '@/components/ui/spinner'
import { useAuth } from '@/hooks/use-auth'
import { useOnboardingStatus } from '@/hooks/use-onboarding'
import { PROFESSOR, STUDENT } from '@/types'
import { useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { StudentOnboardingForm } from '@/components/features/onboarding/StudentOnboardingForm'
import { ProfessorOnboardingForm } from '@/components/features/onboarding/ProfessorOnboardingForm'
import { PagesLayout } from '@/components/layout/PagesLayout'

export default function OnboardingPage() {
  const { user } = useAuth()
  const router = useRouter()
  const { data: onboardingStatus, isLoading } = useOnboardingStatus()

  useEffect(() => {
    if (!isLoading && !onboardingStatus?.pending) {
      router.push('/home')
    }
  }, [onboardingStatus, isLoading, router])

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner />
      </div>
    )
  }

  if (!user || !onboardingStatus?.pending) {
    return null
  }

  return (
    <PagesLayout title="Onboarding" subtitle="Complete seu perfil para começar a usar o sistema">
      <div className="w-full">
        <Card>
          <CardHeader>
            <CardTitle>
              {user.role === STUDENT ? 'Perfil do Estudante' : 'Perfil do Professor'}
            </CardTitle>
            <CardDescription>
              {user.role === STUDENT
                ? 'Preencha suas informações acadêmicas e envie os documentos necessários'
                : 'Complete suas informações profissionais e envie os documentos obrigatórios'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {user.role === STUDENT && (
              <StudentOnboardingForm onboardingStatus={onboardingStatus} />
            )}
            {user.role === PROFESSOR && (
              <ProfessorOnboardingForm onboardingStatus={onboardingStatus} />
            )}
          </CardContent>
        </Card>
      </div>
    </PagesLayout>
  )
} 