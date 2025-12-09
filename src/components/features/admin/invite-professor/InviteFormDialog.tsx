import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import {
  REGIME_LABELS,
  REGIME_VALUES,
  TIPO_PROFESSOR_EFETIVO,
  TIPO_PROFESSOR_LABELS,
  TIPO_PROFESSOR_SUBSTITUTO,
  type InviteFormData,
} from '@/types'
import { api } from '@/utils/api'
import type { UseFormReturn } from 'react-hook-form'

interface InviteFormDialogProps {
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: InviteFormData) => void
  form: UseFormReturn<InviteFormData>
  isSubmitting: boolean
}

export function InviteFormDialog({ isOpen, onClose, onSubmit, form, isSubmitting }: InviteFormDialogProps) {
  const { data: departments, isLoading: loadingDepartments } = api.inviteProfessor.getDepartments.useQuery()

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Convidar Professor</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="nomeCompleto"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome Completo *</FormLabel>
                  <FormControl>
                    <Input placeholder="Nome do professor" {...field} />
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
                  <FormLabel>Email *</FormLabel>
                  <FormControl>
                    <Input type="email" placeholder="professor@ufba.br" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="departamentoId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Departamento *</FormLabel>
                  <Select
                    onValueChange={(value) => field.onChange(parseInt(value))}
                    value={field.value?.toString()}
                    disabled={loadingDepartments}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o departamento" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {departments?.map((dept) => (
                        <SelectItem key={dept.id} value={dept.id.toString()}>
                          {dept.sigla ? `${dept.sigla} - ${dept.nome}` : dept.nome}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="regime"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Regime *</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Regime" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {REGIME_VALUES.map((regime) => (
                          <SelectItem key={regime} value={regime}>
                            {REGIME_LABELS[regime]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tipoProfessor"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tipo</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value || TIPO_PROFESSOR_EFETIVO}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Tipo" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value={TIPO_PROFESSOR_EFETIVO}>
                          {TIPO_PROFESSOR_LABELS[TIPO_PROFESSOR_EFETIVO]}
                        </SelectItem>
                        <SelectItem value={TIPO_PROFESSOR_SUBSTITUTO}>
                          {TIPO_PROFESSOR_LABELS[TIPO_PROFESSOR_SUBSTITUTO]}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="expiresInDays"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Expira em (dias)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min="1"
                      max="30"
                      {...field}
                      onChange={(e) => field.onChange(parseInt(e.target.value))}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? 'Enviando...' : 'Enviar Convite'}
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
