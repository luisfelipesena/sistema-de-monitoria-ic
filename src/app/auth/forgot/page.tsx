"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { ArrowLeft } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/hooks/use-auth"
import { z } from "zod"

import { emailSchema, RequestPasswordResetInput } from "@/types"

const requestPasswordResetSchema = z.object({
  email: emailSchema,
})

export default function ForgotPasswordPage() {
  const { requestPasswordReset, errors, clearErrors, successMsg } = useAuth()

  const form = useForm<RequestPasswordResetInput>({
    resolver: zodResolver(requestPasswordResetSchema),
    defaultValues: {
      email: "",
    },
  })

  useEffect(() => {
    return () => {
      clearErrors()
    }
  }, [clearErrors])

  const onSubmit = async (data: RequestPasswordResetInput) => {
    await requestPasswordReset(data)
    toast.success("Solicitação recebida", {
      description: "Caso exista uma conta, enviaremos as instruções por e-mail.",
    })
    form.reset()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          <span className="text-sm">Voltar ao início</span>
        </Link>
      </div>

      <div className="flex justify-center">
        <div className="space-y-8 w-full max-w-md">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center mb-6">
              <img src="/images/ic-logo-clean.png" alt="Monitoria IC" className="h-16 w-16" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Esqueceu sua senha?</h1>
            <p className="text-slate-600 text-sm leading-relaxed">
              Informe o e-mail cadastrado. Se encontrarmos uma conta, enviaremos um link para redefinição da senha.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 p-8 bg-white shadow-lg">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input
                          type="email"
                          label="E-mail"
                          placeholder="seu.email@exemplo.com"
                          className="h-12"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {successMsg && <p className="text-green-600 text-center text-sm">{successMsg}</p>}
                {errors ? <p className="text-sm text-red-600 text-center">{errors}</p> : null}

                <Button type="submit" className="w-full h-12 text-base font-medium">
                  Enviar instruções
                </Button>
              </form>
            </Form>

            <div className="mt-8 pt-6 border-t border-slate-200">
              <div className="text-center text-sm text-slate-600">
                <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">
                  Voltar para login
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
