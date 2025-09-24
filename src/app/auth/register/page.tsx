"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import Link from "next/link"
import { useEffect } from "react"
import { useForm } from "react-hook-form"

import { Button } from "@/components/ui/button"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useAuth } from "@/hooks/use-auth"
import { RegisterUserInput, registerUserSchema } from "@/types"
import { useRouter } from "next/navigation"
import { toast } from "sonner"

export default function RegisterPage() {
  const { registerLocal, resendVerification, signInCas, errors, clearErrors } = useAuth()
  const router = useRouter()

  const form = useForm<RegisterUserInput>({
    resolver: zodResolver(registerUserSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "student",
    },
  })

  useEffect(() => {
    return () => {
      clearErrors()
    }
  }, [clearErrors])

  const onSubmit = async (data: RegisterUserInput) => {
    await registerLocal(data)
    toast.success("Cadastro realizado!", {
      description: "Verifique seu e-mail para ativar sua conta.",
    })
    router.push("/auth/login")
  }

  return (
    <div className="grid gap-8 md:grid-cols-[1.2fr_1fr]">
      <div className="space-y-6">
        <h1 className="text-3xl font-bold text-slate-900">Crie sua conta</h1>
        <p className="text-slate-600 text-sm leading-relaxed">
          Cadastre-se utilizando seu e-mail para acessar o Sistema de Monitoria IC. Professores e estudantes podem criar
          contas separadamente e completar o perfil após o primeiro acesso.
        </p>

        <div className="rounded-lg border border-slate-200 p-6 bg-white shadow-sm">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input label="Nome completo" placeholder="Nome e sobrenome" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input label="E-mail" type="email" placeholder="nome@ufba.br" {...field} />
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
                      <Input label="Senha" type="password" placeholder="Crie uma senha forte" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <Label className="text-sm font-medium text-slate-600">Eu sou</Label>
                    <FormControl>
                      <RadioGroup
                        onValueChange={field.onChange}
                        value={field.value}
                        className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2"
                      >
                        <label className="flex items-center space-x-2 rounded-lg border border-slate-200 p-3 hover:border-blue-500 cursor-pointer">
                          <RadioGroupItem value="student" id="role-student" />
                          <span className="text-sm">Aluno(a)</span>
                        </label>
                        <label className="flex items-center space-x-2 rounded-lg border border-slate-200 p-3 hover:border-blue-500 cursor-pointer">
                          <RadioGroupItem value="professor" id="role-professor" />
                          <span className="text-sm">Professor(a)</span>
                        </label>
                      </RadioGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {errors ? <p className="text-sm text-red-600">{errors}</p> : null}

              <Button type="submit" className="w-full">
                Criar conta
              </Button>
            </form>
          </Form>

          <div className="mt-6 flex items-center justify-between text-sm text-slate-600">
            <span>Já possui conta?</span>
            <Link href="/auth/login" className="text-blue-600 hover:text-blue-700">
              Fazer login
            </Link>
          </div>
        </div>
      </div>

      <aside className="h-full w-full rounded-xl bg-gradient-to-br from-sky-500 via-sky-600 to-sky-700 text-white p-8 shadow-xl">
        <div className="space-y-6">
          <h2 className="text-2xl font-semibold">Preferência por e-mail UFBA?</h2>
          <p className="text-sky-100 text-sm leading-relaxed">
            Deseja utilizar suas credenciais UFBA? Você pode fazer login via e-mail UFBA a qualquer momento. Após criar
            uma conta local, enviamos um e-mail de verificação para ativar o acesso.
          </p>

          <Button variant="secondary" className="w-full" onClick={signInCas}>
            Entrar com em e-mail UFBA
          </Button>

          <div className="text-xs text-sky-50 space-y-2">
            <p>• Alunos e professores podem completar o perfil após o login.</p>
            <p>• É necessário confirmar o e-mail informado para ativar a conta.</p>
            <p>• Caso não encontre o e-mail de confirmação, verifique a caixa de spam ou reenvie a verificação.</p>

            <Button
              variant="ghost"
              className="mt-3 text-white hover:bg-white/10"
              onClick={() => resendVerification({ email: form.getValues("email") })}
            >
              Reenviar e-mail de verificação
            </Button>
          </div>
        </div>
      </aside>
    </div>
  )
}
