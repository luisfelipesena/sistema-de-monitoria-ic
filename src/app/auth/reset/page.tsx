"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { Suspense, useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
import { Eye, EyeOff, Loader2 } from "lucide-react"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/hooks/use-auth"
import { z } from "zod"

import { passwordSchema, ResetPasswordWithTokenInput } from "@/types"

const resetPasswordFormSchema = z
.object({
  token: z.string().min(1),
  password: passwordSchema,
  confirmPassword: passwordSchema,
})
.refine((data) => data.password === data.confirmPassword, {
  message: "Senhas não coincidem",
    path: ["confirmPassword"],
  })

type ResetPasswordFormInput = z.infer<typeof resetPasswordFormSchema>

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token") ?? ""
  return <ResetPasswordInner token={token} />
}

function ResetPasswordInner({ token }: { token: string }) {
  const router = useRouter()
  const { resetPassword, errors, clearErrors } = useAuth()
  
  const form = useForm<ResetPasswordFormInput>({
    resolver: zodResolver(resetPasswordFormSchema),
    defaultValues: {
      token,
      password: "",
      confirmPassword: "",
    },
  })

  useEffect(() => {
    form.setValue("token", token)
  }, [form, token])
  
  useEffect(() => {
    return () => {
      clearErrors()
    }
  }, [clearErrors])

  const [showPassword1, setShowPassword1] = useState(false)
  const [showPassword2, setShowPassword2] = useState(false)
  const onSubmit = async (data: ResetPasswordFormInput) => {
    const payload: ResetPasswordWithTokenInput = {
      token: data.token,
      password: data.password,
    }

    try {
      await resetPassword(payload)
      toast.success("Senha redefinida com sucesso!", {
        description: "Redirecionando para o login...",
      })
      setTimeout(() => {
        router.push("/auth/login")
      }, 1500)
    } catch {
      // Error is handled by useAuth hook (sets errors state)
    }
  }

  if (!token) {
    return (
      <div className="space-y-6 text-center">
        <h1 className="text-2xl font-semibold text-slate-900">Link inválido</h1>
        <p className="text-slate-600 text-sm">
          Não encontramos um token de redefinição. Solicite um novo link na página de esqueci minha senha.
        </p>
        <div className="flex justify-center">
          <Button asChild>
            <Link href="/auth/forgot">Solicitar novo link</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold text-slate-900">Definir nova senha</h1>
        <p className="text-sm text-slate-600">Crie uma nova senha forte para acessar o Sistema de Monitoria IC.</p>
      </div>

      <div className="rounded-lg border border-slate-200 p-6 bg-white shadow-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <div className="relative">
                      <Input type={showPassword1 ? "text" : "password"} label="Nova senha" placeholder="Crie uma senha forte" {...field} />
                      <button
                        type="button"
                        onClick={() => setShowPassword1((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/5 text-slate-400 hover:text-slate-600 transition-colors"
                        aria-label={showPassword1 ? "Ocultar senha" : "Mostrar senha"}
                      >
                        {showPassword1 ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
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
                    <div className="relative">
                      <Input type={showPassword2 ? "text" : "password"} label="Confirmar nova senha" placeholder="Repita a senha" {...field} />
                      <button
                        type="button"
                        onClick={() => setShowPassword2((prev) => !prev)}
                        className="absolute right-3 top-1/2 -translate-y-1/5 text-slate-400 hover:text-slate-600 transition-colors"
                        aria-label={showPassword2 ? "Ocultar senha" : "Mostrar senha"}
                      >
                        {showPassword2 ? (
                          <EyeOff className="h-5 w-5" />
                        ) : (
                          <Eye className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {errors ? <p className="text-sm text-red-600">{errors}</p> : null}

            <Button type="submit" className="w-full" disabled={form.formState.isSubmitting}>
              {form.formState.isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Atualizando...
                </>
              ) : (
                "Atualizar senha"
              )}
            </Button>
          </form>
        </Form>

        <div className="mt-6 text-sm text-slate-600 text-center space-y-2">
          <p>
            <Link href="/auth/login" className="text-blue-600 hover:text-blue-700">
              Voltar para login
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Carregando...</p>}>
      <ResetPasswordContent />
    </Suspense>
  )
}
