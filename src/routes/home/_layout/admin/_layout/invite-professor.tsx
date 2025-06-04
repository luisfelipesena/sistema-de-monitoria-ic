import { PagesLayout } from '@/components/layout/PagesLayout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { createFileRoute } from '@tanstack/react-router';
import { Mail, Send, Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useInviteProfessor } from '@/hooks/use-admin';
import type { InviteProfessorResponse } from '@/routes/api/admin/invite-professor';

const inviteSchema = z.object({
  email: z.string().email('Por favor, insira um email válido.'),
});

type InviteFormData = z.infer<typeof inviteSchema>;

export const Route = createFileRoute('/home/_layout/admin/_layout/invite-professor')({
  component: InviteProfessorPage,
});

function InviteProfessorPage() {
  const { toast } = useToast();
  const inviteProfessorMutation = useInviteProfessor();

  const form = useForm<InviteFormData>({
    resolver: zodResolver(inviteSchema),
    defaultValues: {
      email: '',
    },
  });

  const onSubmit = async (data: InviteFormData) => {
    inviteProfessorMutation.mutate(
      data.email,
      {
        onSuccess: (response) => {
          if (response.success) {
            toast({ title: 'Convite Enviado!', description: response.message });
            form.reset();
          } else {
            toast({
              title: 'Falha ao Enviar Convite',
              description: response.message,
              variant: 'destructive',
            });
          }
        },
        onError: (error) => {
          toast({
            title: 'Erro no Servidor',
            description: error.message || 'Não foi possível enviar o convite.',
            variant: 'destructive',
          });
        },
      }
    );
  };

  return (
    <PagesLayout
      title="Convidar Professor"
      subtitle="Envie um convite para um novo professor se juntar à plataforma."
    >
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
                {...form.register('email')}
                placeholder="exemplo@ufba.br"
                className={form.formState.errors.email ? 'border-red-500' : ''}
              />
              {form.formState.errors.email && (
                <p className="text-sm text-red-500 mt-1">
                  {form.formState.errors.email.message}
                </p>
              )}
            </div>
            <Button type="submit" className="w-full" disabled={inviteProfessorMutation.isPending}>
              {inviteProfessorMutation.isPending ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...
                </>
              ) : (
                <><Send className="mr-2 h-4 w-4" /> Enviar Convite
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </PagesLayout>
  );
} 