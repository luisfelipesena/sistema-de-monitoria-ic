"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useEffect } from "react"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/hooks/use-auth"
import { LoginUserInput, loginUserSchema } from "@/types"
import { toast } from "sonner"

export default function LoginPage() {
  const { signInLocal, signInCas, errors, clearErrors } = useAuth()

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
    <div className="grid gap-8 md:grid-cols-[1.2fr_1fr]">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-slate-900">Bem-vindo de volta</h1>
        <p className="text-slate-600 text-sm leading-relaxed">
          Faça login com seu e-mail institucional para acessar o Sistema de Monitoria IC. Caso possua acesso via UFBA,
          você também pode utilizar o login UFBA.
        </p>

        <div className="rounded-lg border border-slate-200 p-6 bg-white shadow-sm">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input type="email" placeholder="nome@ufba.br" label="E-mail" {...field} />
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
                      <Input type="password" placeholder="••••••••" label="Senha" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {errors ? <p className="text-sm text-red-600">{errors}</p> : null}

              <Button type="submit" className="w-full">
                Entrar com e-mail
              </Button>
              <div className="flex justify-between text-sm">
                <Link href="/auth/forgot" className="text-blue-600 hover:text-blue-700">
                  Esqueci minha senha
                </Link>
              </div>
            </form>
          </Form>

          <div className="mt-6 flex items-center justify-between text-sm text-slate-600">
            <span>Não possui conta?</span>
            <Link href="/auth/register" className="text-blue-600 hover:text-blue-700">
              Cadastre-se
            </Link>
          </div>
        </div>
      </div>

      <aside className="h-full w-full rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 text-white p-8 shadow-xl">
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Prefere o acesso institucional via e-mail UFBA?</h2>
          <p className="text-blue-100 text-sm leading-relaxed">
            Utilize o login via e-mail UFBA para aproveitar autenticação automática com sua conta UFBA. Ideal para
            professores e estudantes que já possuem credenciais institucionais ativas.
          </p>

          <Button variant="secondary" className="w-full" onClick={signInCas}>
            Entrar com e-mail UFBA
          </Button>

          <div className="text-xs text-blue-50 space-y-2">
            <p>• Professores e alunos podem optar por qualquer método de autenticação.</p>
            <p>• Após criar sua conta por e-mail, confirme o endereço informado para ativar o acesso.</p>
            <p>• Caso tenha dificuldades com a autenticação via e-mail UFBA, utilize o login local como alternativa.</p>
          </div>
        </div>
      </aside>
    </div>
  )
}
