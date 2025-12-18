"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { ArrowLeft, Loader2 } from "lucide-react"
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
  const { registerLocal, errors, clearErrors } = useAuth()
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
    <div className="space-y-6">
      <div className="flex justify-center">
        <div className="space-y-8 w-full max-w-md">
          <div className="text-center space-y-3">
            <div className="flex items-center justify-center mb-6">
              <img src="/images/ic-logo-clean.png" alt="Monitoria IC" className="h-16 w-16" />
            </div>
            <h1 className="text-3xl font-bold text-slate-900">Crie sua conta</h1>
            <p className="text-slate-600 text-sm leading-relaxed">
              Cadastre-se para acessar o Sistema de Monitoria IC. Complete seu perfil após o primeiro acesso.
            </p>
          </div>

          <div className="rounded-xl border border-slate-200 p-8 bg-white shadow-lg">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormControl>
                        <Input label="Nome completo" placeholder="Nome e sobrenome" className="h-12" {...field} />
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
                        <Input
                          label="E-mail"
                          type="email"
                          placeholder="seu.email@exemplo.com"
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
                  name="role"
                  render={({ field }) => (
                    <FormItem>
                      <Label className="text-sm font-medium text-slate-900 mb-3 block">Eu sou</Label>
                      <FormControl>
                        <RadioGroup
                          onValueChange={field.onChange}
                          value={field.value}
                          className="grid grid-cols-2 gap-3"
                        >
                          <label className="flex items-center space-x-3 rounded-lg border-2 border-slate-200 p-4 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all">
                            <RadioGroupItem value="student" id="role-student" />
                            <span className="text-sm font-medium">Aluno(a)</span>
                          </label>
                          <label className="flex items-center space-x-3 rounded-lg border-2 border-slate-200 p-4 hover:border-blue-500 hover:bg-blue-50 cursor-pointer transition-all">
                            <RadioGroupItem value="professor" id="role-professor" />
                            <span className="text-sm font-medium">Professor(a)</span>
                          </label>
                        </RadioGroup>
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
                      Criando conta...
                    </>
                  ) : (
                    "Criar conta"
                  )}
                </Button>
              </form>
            </Form>

            <div className="mt-8 pt-6 border-t border-slate-200">
              <div className="text-center text-sm text-slate-600">
                <span>Já possui conta? </span>
                <Link href="/auth/login" className="text-blue-600 hover:text-blue-700 font-medium">
                  Fazer login
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
