import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { useToast } from '@/hooks/use-toast'
import { api } from '@/utils/api'
import type { Semestre, TipoVaga } from '@/types'
import { CheckCircle2, Clock, FileSignature, FileText, Send } from 'lucide-react'

interface Props {
  ano: number
  semestre: Semestre
  tipo: TipoVaga
  defaultEmail: string
  disabled: boolean
}

export function ConsolidacaoSignatureSection({ ano, semestre, tipo, defaultEmail, disabled }: Props) {
  const label = tipo === 'BOLSISTA' ? 'Bolsistas' : 'Voluntários'
  const { toast } = useToast()
  const [isSignatureDialogOpen, setIsSignatureDialogOpen] = useState(false)
  const [chefeEmailInput, setChefeEmailInput] = useState(defaultEmail)
  const [chefeNomeInput, setChefeNomeInput] = useState('')
  const [substituirAssinatura, setSubstituirAssinatura] = useState(false)
  const [latestSignatureLink, setLatestSignatureLink] = useState<string | null>(null)
  const {
    data: signatureStatus,
    refetch,
    isLoading: loadingStatus,
    error: statusError,
  } = api.relatorios.getConsolidacaoSignatureStatus.useQuery({
    ano,
    semestre,
    tipo,
  })
  const request = api.relatorios.solicitarAssinaturaChefeConsolidacao.useMutation({
    onSuccess: (result) => {
      setLatestSignatureLink(result.link)
      setIsSignatureDialogOpen(false)
      setSubstituirAssinatura(false)
      void refetch()
      toast({ title: 'Solicitação enviada', description: result.message })
    },
    onError: (error) =>
      toast({ title: 'Erro ao solicitar assinatura', description: error.message, variant: 'destructive' }),
  })
  const isRequestingSignature = request.isPending
  const handleSendSignatureRequest = () =>
    request.mutate({
      ano,
      semestre,
      tipo,
      chefeEmail: chefeEmailInput.trim(),
      chefeNome: chefeNomeInput.trim(),
      substituirAssinatura,
    })
  const downloadPDFQuery = api.relatorios.downloadConsolidacaoPDF.useQuery({ ano, semestre, tipo }, { enabled: false })
  const handleDownloadPDF = async () => {
    try {
      const result = await downloadPDFQuery.refetch({ throwOnError: true })
      if (!result.data) throw new Error('PDF não disponível')
      const bytes = Uint8Array.from(atob(result.data.pdfBase64), (char) => char.charCodeAt(0))
      const url = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }))
      const link = document.createElement('a')
      link.href = url
      link.download = `resultados-selecao-${tipo === 'BOLSISTA' ? 'bolsistas' : 'voluntarios'}-${ano}-${semestre === 'SEMESTRE_1' ? '1' : '2'}.pdf`
      link.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      toast({
        title: 'Erro ao baixar PDF',
        description: error instanceof Error ? error.message : 'Não foi possível gerar o PDF.',
        variant: 'destructive',
      })
    }
  }

  return (
    <div className="p-4 border rounded-lg bg-gray-50/50 space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <FileSignature className="h-5 w-5 text-indigo-600" />
          <h4 className="font-medium text-base">Assinatura do Chefe: {label}</h4>
        </div>
        {statusError ? (
          <Badge variant="destructive">Erro ao consultar assinatura</Badge>
        ) : loadingStatus ? (
          <Badge variant="outline">Consultando assinatura...</Badge>
        ) : signatureStatus?.isSigned ? (
          <Badge className="bg-emerald-100 text-emerald-800 border-emerald-300 flex items-center gap-1">
            <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            Assinado em {new Date(signatureStatus.chefeAssinouEm!).toLocaleDateString('pt-BR')}
          </Badge>
        ) : signatureStatus?.isExpired ? (
          <Badge variant="outline">Link expirado</Badge>
        ) : signatureStatus?.hasPendingToken ? (
          <Badge variant="outline" className="bg-amber-50 text-amber-800 border-amber-300 flex items-center gap-1">
            <Clock className="h-3.5 w-3.5 text-amber-600 animate-pulse" />
            Aguardando Assinatura ({signatureStatus.chefeEmail})
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-gray-100 text-gray-700 border-gray-300">
            Não Solicitado
          </Badge>
        )}
      </div>

      <p className="text-sm text-muted-foreground">
        O PDF reúne os resultados da modalidade {label.toLowerCase()} no período. O Chefe do Departamento receberá um
        e-mail com link exclusivo para assinar digitalmente.
      </p>

      <div className="flex flex-wrap gap-3 pt-1">
        <Dialog
          open={isSignatureDialogOpen}
          onOpenChange={(open) => {
            if (open) {
              setChefeNomeInput(signatureStatus?.chefeNome || '')
              setChefeEmailInput(signatureStatus?.chefeEmail || defaultEmail)
              setSubstituirAssinatura(false)
            }
            setIsSignatureDialogOpen(open)
          }}
        >
          <DialogTrigger asChild>
            <Button
              disabled={loadingStatus || Boolean(statusError)}
              variant="outline"
              className="border-indigo-200 text-indigo-700 hover:bg-indigo-50"
            >
              <Send className="h-4 w-4 mr-2 text-indigo-600" />
              {signatureStatus?.isSigned
                ? 'Solicitar nova assinatura'
                : signatureStatus?.hasPendingToken
                  ? 'Reenviar Solicitação de Assinatura'
                  : 'Solicitar Assinatura por E-mail'}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Solicitar Assinatura do Chefe do Departamento</DialogTitle>
              <DialogDescription>
                Gerar esta solicitação invalida o link anterior desta modalidade. Envie um e-mail para o Chefe de
                Departamento contendo o link público para assinatura digital da Consolidação de {label} ({ano}.
                {semestre === 'SEMESTRE_1' ? '1' : '2'}).
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div className="space-y-2">
                <Label htmlFor={`chefeNome-${tipo}`}>Nome do Chefe de Departamento</Label>
                <Input
                  id={`chefeNome-${tipo}`}
                  value={chefeNomeInput}
                  onChange={(e) => setChefeNomeInput(e.target.value)}
                  placeholder="Ex: Prof. Dr. João Silva"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor={`chefeEmail-${tipo}`}>E-mail do Chefe de Departamento</Label>
                <Input
                  id={`chefeEmail-${tipo}`}
                  type="email"
                  value={chefeEmailInput}
                  onChange={(e) => setChefeEmailInput(e.target.value)}
                  placeholder="exemplo@ufba.br"
                />
              </div>
            </div>
            {signatureStatus?.isSigned && (
              <Label className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={substituirAssinatura}
                  onChange={(e) => setSubstituirAssinatura(e.target.checked)}
                />
                Invalidar a assinatura atual de {label.toLowerCase()} e solicitar uma nova. A outra modalidade será
                preservada.
              </Label>
            )}
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsSignatureDialogOpen(false)}>
                Cancelar
              </Button>
              <Button
                onClick={handleSendSignatureRequest}
                disabled={
                  isRequestingSignature ||
                  !chefeEmailInput.trim() ||
                  !chefeNomeInput.trim() ||
                  (signatureStatus?.isSigned && !substituirAssinatura)
                }
                className="bg-indigo-600 hover:bg-indigo-700 text-white"
              >
                <Send className="h-4 w-4 mr-2" />
                Enviar Solicitação
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <Button
          onClick={handleDownloadPDF}
          disabled={disabled || downloadPDFQuery.isFetching}
          variant="outline"
          className="border-purple-200 text-purple-700 hover:bg-purple-50"
        >
          <FileText className="h-4 w-4 mr-2 text-purple-600" />
          Baixar PDF Consolidado ({label})
        </Button>
      </div>

      {latestSignatureLink && (
        <div className="mt-3 p-3 bg-indigo-50 border border-indigo-200 rounded-lg flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-sm text-indigo-900 overflow-hidden">
            <FileSignature className="h-4 w-4 text-indigo-600 shrink-0" />
            <span className="font-semibold shrink-0">Link de Assinatura:</span>
            <code className="text-xs bg-indigo-100 px-2 py-0.5 rounded truncate max-w-xs">{latestSignatureLink}</code>
          </div>
          <Button
            size="sm"
            variant="outline"
            className="border-indigo-300 text-indigo-700 hover:bg-indigo-100"
            onClick={() => {
              void navigator.clipboard.writeText(latestSignatureLink)
            }}
          >
            Copiar Link de Assinatura
          </Button>
        </div>
      )}
    </div>
  )
}
