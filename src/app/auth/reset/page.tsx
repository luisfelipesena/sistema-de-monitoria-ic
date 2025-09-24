"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense, useEffect } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

import { Button } from "@/components/ui/button"
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

  const onSubmit = async (data: ResetPasswordFormInput) => {
    const payload: ResetPasswordWithTokenInput = {
      token: data.token,
      password: data.password,
    }

    await resetPassword(payload)
    toast.success("Senha redefinida", {
      description: "Sua senha foi atualizada. Você já pode fazer login.",
    })
    form.reset({ token })
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
                    <Input type="password" label="Nova senha" placeholder="Crie uma senha forte" {...field} />
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
                    <Input type="password" label="Confirmar nova senha" placeholder="Repita a senha" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {errors ? <p className="text-sm text-red-600">{errors}</p> : null}

            <Button type="submit" className="w-full">
              Atualizar senha
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
