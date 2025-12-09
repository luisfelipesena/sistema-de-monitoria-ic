"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, CheckCircle, Loader2 } from "lucide-react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useForm } from "react-hook-form"
import { z } from "zod"
import { Suspense, useState } from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { REGIME_LABELS, TIPO_PROFESSOR_LABELS, type Regime, type TipoProfessor } from "@/types"
import { api } from "@/utils/api"

const acceptInvitationSchema = z
  .object({
    password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
    confirmPassword: z.string().min(6, "Confirme a senha"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  })

type AcceptInvitationInput = z.infer<typeof acceptInvitationSchema>

function AcceptInvitationContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const router = useRouter()
  const [isSuccess, setIsSuccess] = useState(false)

  const { data: invitation, isLoading, error } = api.inviteProfessor.getInvitationByToken.useQuery(
    { token: token || "" },
    { enabled: !!token, retry: false }
  )

  const acceptMutation = api.inviteProfessor.acceptInvitation.useMutation({
    onSuccess: () => {
      setIsSuccess(true)
    },
  })

  const form = useForm<AcceptInvitationInput>({
    resolver: zodResolver(acceptInvitationSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  })

  const onSubmit = async (data: AcceptInvitationInput) => {
    if (!token) return
    await acceptMutation.mutateAsync({
      token,
      password: data.password,
    })
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Link inválido</CardTitle>
            <CardDescription>O link de convite está incompleto ou inválido.</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/auth/login">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Ir para login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-red-600">Convite inválido</CardTitle>
            <CardDescription>{error.message}</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <Link href="/auth/login">
              <Button variant="outline">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Ir para login
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <CheckCircle className="h-16 w-16 text-green-600" />
            </div>
            <CardTitle className="text-green-600">Conta ativada com sucesso!</CardTitle>
            <CardDescription>
              Sua conta foi criada. Você pode fazer login e completar seu perfil.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <Button onClick={() => router.push("/auth/login")} className="w-full">
              Fazer login
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <div className="space-y-8 w-full max-w-md">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center mb-6">
              <img src="/images/ic-logo-clean.png" alt="Monitoria IC" className="h-16 w-16" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Bem-vindo(a)!</h1>
            <p className="text-slate-600 text-sm leading-relaxed">
              Você foi convidado(a) para fazer parte do Sistema de Monitoria IC como professor(a).
            </p>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Dados do convite</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-2 text-sm">
                <span className="text-slate-500">Nome:</span>
                <span className="font-medium">{invitation?.nomeCompleto}</span>

                <span className="text-slate-500">E-mail:</span>
                <span className="font-medium">{invitation?.email}</span>

                <span className="text-slate-500">Departamento:</span>
                <span className="font-medium">
                  {invitation?.departamento?.sigla
                    ? `${invitation.departamento.sigla} - ${invitation.departamento.nome}`
                    : invitation?.departamento?.nome}
                </span>

                <span className="text-slate-500">Regime:</span>
                <span className="font-medium">
                  {invitation?.regime ? REGIME_LABELS[invitation.regime as Regime] : "-"}
                </span>

                <span className="text-slate-500">Tipo:</span>
                <span className="font-medium">
                  {invitation?.tipoProfessor
                    ? TIPO_PROFESSOR_LABELS[invitation.tipoProfessor as TipoProfessor]
                    : "-"}
                </span>
              </div>
            </CardContent>
          </Card>

          <div className="rounded-xl border border-slate-200 p-8 bg-white shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Crie sua senha</h2>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          label="Senha"
                          type="password"
                          placeholder="Crie uma senha forte"
                          className="h-12"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="confirmPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          label="Confirmar senha"
                          type="password"
                          placeholder="Digite a senha novamente"
                          className="h-12"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {acceptMutation.error && (
                  <p className="text-sm text-red-600 text-center">{acceptMutation.error.message}</p>
                )}

                <Button
                  type="submit"
                  className="w-full h-12 text-base font-medium"
                  disabled={acceptMutation.isPending}
                >
                  {acceptMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Ativando conta...
                    </>
                  ) : (
                    "Ativar minha conta"
                  )}
                </Button>
              </form>
            </Form>
          </div>

          <div className="flex items-center justify-center">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-sm">Voltar ao início</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function AcceptInvitationPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <AcceptInvitationContent />
    </Suspense>
  )
}
