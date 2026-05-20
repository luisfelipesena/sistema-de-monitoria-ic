"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import { z } from "zod"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import { passwordSchema, type SetPasswordInput } from "@/types"

type CreatePasswordFormValues = z.infer<typeof createPasswordSchema>
type ChangePasswordFormValues = z.infer<typeof changePasswordSchema>

const createPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Senhas não coincidem",
    path: ["confirmPassword"],
  })

const changePasswordSchema = z
  .object({
    currentPassword: passwordSchema,
    password: passwordSchema,
    confirmPassword: passwordSchema,
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Senhas não coincidem",
    path: ["confirmPassword"],
  })

export function PasswordManager() {
  const { provider, setPassword, errors, clearErrors } = useAuth()
  const { toast } = useToast()
  const [isSubmitting, setIsSubmitting] = useState(false)

  useEffect(() => {
    return () => {
      clearErrors()
    }
  }, [clearErrors])

  const createForm = useForm<CreatePasswordFormValues>({
    resolver: zodResolver(createPasswordSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  })

  const changeForm = useForm<ChangePasswordFormValues>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: {
      currentPassword: "",
      password: "",
      confirmPassword: "",
    },
  })

  if (!provider) {
    return null
  }

  const handleCreatePassword = async (data: CreatePasswordFormValues) => {
    try {
      setIsSubmitting(true)
      await setPassword({ password: data.password })
      toast({
        title: "Senha definida",
        description: "Agora você também pode acessar com e-mail e senha.",
      })
      createForm.reset()
      clearErrors()
    } catch (error) {
      // erro já tratado no hook
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleChangePassword = async (data: ChangePasswordFormValues) => {
    try {
      setIsSubmitting(true)
      const payload: SetPasswordInput = {
        password: data.password,
        currentPassword: data.currentPassword,
      }
      await setPassword(payload)
      toast({
        title: "Senha atualizada",
        description: "Suas credenciais foram atualizadas com sucesso.",
      })
      changeForm.reset()
      clearErrors()
    } catch (error) {
      // erro já tratado no hook
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciamento de Senha</CardTitle>
        <CardDescription>
          {provider === "cas"
            ? "Defina uma senha para também acessar pelo login local."
            : "Altere sua senha de acesso com segurança."}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {provider === "cas" ? (
          <Form {...createForm}>
            <form onSubmit={createForm.handleSubmit(handleCreatePassword)} className="space-y-4">
              <FormField
                control={createForm.control}
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
                control={createForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input type="password" label="Confirmar senha" placeholder="Repita a senha" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {errors ? <p className="text-sm text-red-600">{errors}</p> : null}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : "Definir senha"}
              </Button>
            </form>
          </Form>
        ) : (
          <Form {...changeForm}>
            <form onSubmit={changeForm.handleSubmit(handleChangePassword)} className="space-y-4">
              <FormField
                control={changeForm.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input type="password" label="Senha atual" placeholder="Sua senha atual" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={changeForm.control}
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
                control={changeForm.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Input type="password" label="Confirmar senha" placeholder="Repita a nova senha" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {errors ? <p className="text-sm text-red-600">{errors}</p> : null}

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? "Salvando..." : "Atualizar senha"}
              </Button>
            </form>
          </Form>
        )}
      </CardContent>
    </Card>
  )
}
