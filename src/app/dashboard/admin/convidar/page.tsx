"use client"

import { PagesLayout } from "@/components/layout/PagesLayout"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { api } from "@/utils/api"
import { zodResolver } from "@hookform/resolvers/zod"
import { Loader2, Mail, Send } from "lucide-react"
import { useForm } from "react-hook-form"
import { toast } from "sonner"
import { z } from "zod"

export const dynamic = "force-dynamic"

const inviteSchema = z.object({
  email: z.string().email("Por favor, insira um email válido."),
})

type InviteFormData = z.infer<typeof inviteSchema>

export default function InviteProfessorPage() {
  const utils = api.useUtils()
  const { data: user } = api.auth.me.useQuery()

  const inviteProfessorMutation = api.admin.inviteProfessor.useMutation({
    onSuccess: (response) => {
      if (response.success) {
        toast.success("Convite enviado com sucesso!")
        form.reset()
      } else {
        toast.error("Falha ao enviar convite", {
          description: response.error,
        })
      }
    },
    onError: (error: any) => {
      toast.error("Erro no servidor", {
        description: error.message || "Não foi possível enviar o convite.",
      })
    },
  })

  const form = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: "",
    },
  })

  const onSubmit = async (data: InviteFormData) => {
    if (!user?.id) {
      toast.error("Usuário não autenticado")
      return
    }

    inviteProfessorMutation.mutate({
      email: data.email,
      adminUserId: user.id,
    })
  }

  return (
    <PagesLayout title="Convidar Professor" subtitle="Envie um convite para um novo professor se juntar à plataforma.">
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Enviar Convite de Professor
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <Label htmlFor="email">Email do Professor</Label>
              <Input
                id="email"
                type="email"
                {...form.register("email")}
                placeholder="exemplo@ufba.br"
                className={form.formState.errors.email ? "border-red-500" : ""}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-500 mt-1">{form.formState.errors.email.message}</p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={inviteProfessorMutation.isPending || !user}>
              {inviteProfessorMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Send className="mr-2 h-4 w-4" />
                  Enviar Convite
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </PagesLayout>
  )
}
