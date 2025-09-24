"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useEffect } from "react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"

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
  const { requestPasswordReset, errors, clearErrors } = useAuth()

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
    <div className="space-y-8">
      <div className="text-center space-y-3">
        <h1 className="text-3xl font-bold text-slate-900">Esqueceu sua senha?</h1>
        <p className="text-sm text-slate-600">
          Informe o e-mail cadastrado. Se encontrarmos uma conta, enviaremos um link para redefinição da senha.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 p-6 bg-white shadow-sm">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <Input type="email" label="E-mail" placeholder="nome@ufba.br" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {errors ? <p className="text-sm text-red-600">{errors}</p> : null}

            <Button type="submit" className="w-full">
              Enviar instruções
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
