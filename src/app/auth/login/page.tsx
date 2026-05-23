"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Eye, EyeOff, Loader2 } from "lucide-react"
import Link from "next/link"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/hooks/use-auth"
import { LoginUserInput, loginUserSchema } from "@/types"
import { toast } from "sonner"

export default function LoginPage() {
  const { signInLocal, errors, clearErrors } = useAuth()
  const [showPassword, setShowPassword] = useState(false)

  const form = useForm<LoginUserInput>({
    resolver: zodResolver(loginUserSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  useEffect(() => {
    return () => {
      clearErrors()
    }
  }, [clearErrors])

  const onSubmit = async (data: LoginUserInput) => {
    await signInLocal(data)
    toast.success("Login realizado", {
      description: "Bem-vindo ao Sistema de Monitoria IC",
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <div className="space-y-8 w-full max-w-md">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center mb-6">
              <img src="/images/ic-logo-clean.png" alt="Monitoria IC" className="h-16 w-16" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Bem-vindo de volta</h1>
            <p className="text-slate-600 text-sm leading-relaxed">
              Faça login com seu e-mail para acessar o Sistema de Monitoria IC.
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
                          placeholder="seu.email@exemplo.com"
                          label="E-mail"
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
                  name="password"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <div className="relative">
                          <Input
                            type={showPassword ? "text" : "password"}
                            placeholder="••••••••••"
                            label="Senha"
                            className="h-12 pr-12" 
                            {...field}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword((prev) => !prev)}
                            className="absolute right-3 top-1/2 -translate-y-1/5 text-slate-400 hover:text-slate-600 transition-colors"
                            aria-label={showPassword ? "Ocultar senha" : "Mostrar senha"}
                          >
                            {showPassword ? (
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

                {errors ? <p className="text-sm text-red-600 text-center">{errors}</p> : null}

                <Button type="submit" className="w-full h-12 text-base font-medium" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Entrando...
                    </>
                  ) : (
                    "Entrar"
                  )}
                </Button>

                <div className="text-center">
                  <Link href="/auth/forgot" className="text-sm text-blue-600 hover:text-blue-700">
                    Esqueci minha senha
                  </Link>
                </div>
              </form>
            </Form>

            <div className="mt-8 pt-6 border-t border-slate-200">
              <div className="text-center text-sm text-slate-600">
                <span>Não possui conta? </span>
                <Link href="/auth/register" className="text-blue-600 hover:text-blue-700 font-medium">
                  Cadastre-se
                </Link>
              </div>
            </div>
            <div className="flex items-center justify-center mt-5">
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
    </div>
  )
}