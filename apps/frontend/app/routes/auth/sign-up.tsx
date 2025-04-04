"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useAuth } from "@/hooks/use-auth"
import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useForm } from "react-hook-form"
import { Link, useNavigate } from "react-router"
import * as z from "zod"

// Define the schema based on backend validation
const formSchema = z
  .object({
    email: z.string().email("Email inválido").toLowerCase(),
    password: z.string().min(8, "Senha deve ter pelo menos 8 caracteres"),
    confirmPassword: z.string(),
    // Role is optional here, backend defaults to 'student'
    // Add if you want users to select roles during signup (potentially admin-only feature?)
    // role: z.enum(userRoleEnum.enumValues).optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"], // path of error
  })

type FormValues = z.infer<typeof formSchema>

export default function SignUpPage() {
  const { signUp, isLoading } = useAuth()
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      // role: "student",
    },
  })

  async function onSubmit(values: FormValues) {
    setError(null)
    // Exclude confirmPassword before sending to API
    const { confirmPassword, ...signUpData } = values
    try {
      await signUp(signUpData)
      navigate("/home") // Redirect to home or dashboard after successful sign-up
    } catch (err: any) {
      setError(err.message || "Ocorreu um erro ao tentar cadastrar.")
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl">Cadastre-se</CardTitle>
          <CardDescription>Crie sua conta para acessar o sistema de monitoria.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="seu@email.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="password"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="********" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }: { field: any }) => (
                  <FormItem>
                    <FormLabel>Confirmar Senha</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="********" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Optional Role Selection - uncomment if needed */}
              {/* <FormField
								control={form.control}
								name="role"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Tipo de Usuário</FormLabel>
										<Select onValueChange={field.onChange} defaultValue={field.value}>
											<FormControl>
												<SelectTrigger>
													<SelectValue placeholder="Selecione seu tipo" />
												</SelectTrigger>
											</FormControl>
											<SelectContent>
												{userRoleEnum.enumValues.map((role) => (
													<SelectItem key={role} value={role}>
														{role} // Capitalize later if needed
													</SelectItem>
												))}
											</SelectContent>
										</Select>
										<FormMessage />
									</FormItem>
								)}
							/> */}

              {error && <p className="text-sm font-medium text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Criando conta..." : "Criar Conta"}
              </Button>
            </form>
          </Form>
        </CardContent>
        <CardFooter className="text-sm">
          Já tem uma conta?{" "}
          <Button variant="link" asChild className="p-0 pl-1">
            <Link to="/auth/sign-in">Entrar</Link>
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
