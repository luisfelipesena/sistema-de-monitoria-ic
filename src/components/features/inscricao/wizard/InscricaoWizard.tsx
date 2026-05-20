"use client"

import { FileUploadField } from "@/components/ui/FileUploadField"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { useAuth } from "@/hooks/use-auth"
import { useToast } from "@/hooks/use-toast"
import {
  GENERO_FEMININO,
  GENERO_MASCULINO,
  GENERO_OUTRO,
  TIPO_DOCUMENTO_INSCRICAO_COMPROVANTE_MATRICULA,
  TIPO_DOCUMENTO_INSCRICAO_CPF,
  TIPO_DOCUMENTO_INSCRICAO_HISTORICO_ESCOLAR,
  TIPO_DOCUMENTO_INSCRICAO_RG,
  TIPO_VAGA_BOLSISTA,
  TIPO_VAGA_VOLUNTARIO,
  type TipoDocumentoInscricao,
} from "@/types"
import { api } from "@/utils/api"
import { CheckCircle2, FileSignature, Loader2, PenTool, Upload, UserCog } from "lucide-react"
import { useRouter } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import SignatureCanvas from "react-signature-canvas"

type UploadedDocument = { fileId: string; tipoDocumento: TipoDocumentoInscricao }

type WizardStep = "dados" | "declaracao" | "documentos" | "assinatura" | "revisar"

const STEP_ORDER: WizardStep[] = ["dados", "declaracao", "documentos", "assinatura", "revisar"]

interface InscricaoWizardProps {
  projetoId: number
}

export function InscricaoWizard({ projetoId }: InscricaoWizardProps) {
  const router = useRouter()
  const { toast } = useToast()
  const { user } = useAuth()

  const [currentStep, setCurrentStep] = useState<WizardStep>("dados")

  // Data
  const projetoQuery = api.projeto.getAvailableProjects.useQuery()
  const profileQuery = api.aluno.getFullProfile.useQuery()
  const disciplinasQuery = api.discipline.getDisciplines.useQuery()

  const projeto = useMemo(
    () => projetoQuery.data?.find((p) => p.id === projetoId),
    [projetoQuery.data, projetoId]
  )

  const criarMutation = api.inscricao.criarInscricao.useMutation()

  // Form fields
  const [tipoVaga, setTipoVaga] = useState<"BOLSISTA" | "VOLUNTARIO" | "">("")
  const [cursouComponente, setCursouComponente] = useState<"sim" | "nao" | "">("")
  const [disciplinaEquivalenteId, setDisciplinaEquivalenteId] = useState<number | null>(null)
  const [disciplinaEquivalenteQuery, setDisciplinaEquivalenteQuery] = useState("")
  const [localAssinatura, setLocalAssinatura] = useState("Salvador")
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null)
  const signatureRef = useRef<SignatureCanvas>(null)

  // Profile patch
  const [patch, setPatch] = useState<{
    nomeCompleto?: string
    nomeSocial?: string
    cpf?: string
    rg?: string
    dataNascimento?: string
    genero?: "MASCULINO" | "FEMININO" | "OUTRO"
    telefone?: string
    telefoneFixo?: string
    cursoNome?: string
    banco?: string
    agencia?: string
    conta?: string
    digitoConta?: string
    endereco?: {
      rua: string
      numero?: number | null
      bairro: string
      cidade: string
      estado: string
      cep: string
      complemento?: string
    }
  }>({})

  useEffect(() => {
    if (!profileQuery.data) return
    const p = profileQuery.data
    setPatch({
      nomeCompleto: p.nomeCompleto ?? "",
      nomeSocial: p.nomeSocial ?? "",
      cpf: p.cpf ?? "",
      rg: p.rg ?? "",
      dataNascimento: p.dataNascimento ? new Date(p.dataNascimento).toISOString().slice(0, 10) : "",
      genero: (p.genero as typeof patch.genero) ?? undefined,
      telefone: p.telefone ?? "",
      telefoneFixo: p.telefoneFixo ?? "",
      cursoNome: p.cursoNome ?? "",
      banco: p.banco ?? "",
      agencia: p.agencia ?? "",
      conta: p.conta ?? "",
      digitoConta: p.digitoConta ?? "",
      endereco: p.endereco
        ? {
            rua: p.endereco.rua ?? "",
            numero: p.endereco.numero ?? null,
            bairro: p.endereco.bairro ?? "",
            cidade: p.endereco.cidade ?? "",
            estado: p.endereco.estado ?? "",
            cep: p.endereco.cep ?? "",
            complemento: p.endereco.complemento ?? "",
          }
        : { rua: "", numero: null, bairro: "", cidade: "", estado: "", cep: "" },
    })
  }, [profileQuery.data])

  // Documents
  const [documentos, setDocumentos] = useState<UploadedDocument[]>([])
  const tempEntityId = useMemo(() => `wizard-${user?.id ?? "anon"}-${projetoId}`, [user?.id, projetoId])

  const setDoc = (tipo: TipoDocumentoInscricao, fileId: string | null) => {
    setDocumentos((prev) => {
      const without = prev.filter((d) => d.tipoDocumento !== tipo)
      return fileId ? [...without, { tipoDocumento: tipo, fileId }] : without
    })
  }

  const clearSignature = () => {
    signatureRef.current?.clear()
    setSignatureDataUrl(null)
  }

  const captureSignature = () => {
    if (!signatureRef.current || signatureRef.current.isEmpty()) {
      toast({ title: "Assinatura vazia", description: "Desenhe sua assinatura antes de continuar", variant: "destructive" })
      return false
    }
    const dataUrl = signatureRef.current.toDataURL("image/png")
    setSignatureDataUrl(dataUrl)
    return true
  }

  const goNext = () => {
    const idx = STEP_ORDER.indexOf(currentStep)
    if (idx < STEP_ORDER.length - 1) setCurrentStep(STEP_ORDER[idx + 1])
  }
  const goPrev = () => {
    const idx = STEP_ORDER.indexOf(currentStep)
    if (idx > 0) setCurrentStep(STEP_ORDER[idx - 1])
  }

  const validateDadosStep = (): string | null => {
    if (!patch.nomeCompleto) return "Nome completo é obrigatório"
    if (!patch.cpf) return "CPF é obrigatório"
    if (!patch.rg) return "RG é obrigatório"
    if (!patch.dataNascimento) return "Data de nascimento é obrigatória"
    if (!patch.cursoNome) return "Curso é obrigatório"
    if (!patch.endereco?.rua || !patch.endereco?.bairro || !patch.endereco?.cidade || !patch.endereco?.cep) {
      return "Endereço completo é obrigatório"
    }
    if (tipoVaga === "BOLSISTA" && (!patch.banco || !patch.agencia || !patch.conta)) {
      return "Dados bancários são obrigatórios para bolsista"
    }
    return null
  }

  const validateDeclaracaoStep = (): string | null => {
    if (!tipoVaga) return "Escolha o tipo de vaga"
    if (!cursouComponente) return "Informe se cursou o componente"
    if (cursouComponente === "nao" && !disciplinaEquivalenteId) return "Informe a disciplina equivalente"
    return null
  }

  const validateDocumentosStep = (): string | null => {
    const tipos = documentos.map((d) => d.tipoDocumento)
    if (!tipos.includes(TIPO_DOCUMENTO_INSCRICAO_RG)) return "Upload do RG é obrigatório"
    if (!tipos.includes(TIPO_DOCUMENTO_INSCRICAO_CPF)) return "Upload do CPF é obrigatório"
    if (!tipos.includes(TIPO_DOCUMENTO_INSCRICAO_HISTORICO_ESCOLAR)) return "Upload do Histórico Escolar é obrigatório"
    return null
  }

  const validateAssinaturaStep = (): string | null => {
    if (!signatureDataUrl) return "Assine antes de continuar"
    if (!localAssinatura) return "Informe o local"
    return null
  }

  const handleStepAdvance = () => {
    let error: string | null = null
    if (currentStep === "dados") error = validateDadosStep()
    else if (currentStep === "declaracao") error = validateDeclaracaoStep()
    else if (currentStep === "documentos") error = validateDocumentosStep()
    else if (currentStep === "assinatura") {
      if (!signatureDataUrl) {
        if (!captureSignature()) return
      }
      error = validateAssinaturaStep()
    }
    if (error) {
      toast({ title: "Atenção", description: error, variant: "destructive" })
      return
    }
    goNext()
  }

  const handleSubmit = async () => {
    const firstError =
      validateDadosStep() || validateDeclaracaoStep() || validateDocumentosStep() || validateAssinaturaStep()
    if (firstError) {
      toast({ title: "Dados incompletos", description: firstError, variant: "destructive" })
      return
    }

    // Reuse comprovante_matricula from profile if not explicitly uploaded
    const existingComprovante = profileQuery.data?.comprovanteMatriculaFileId
    const docsToSend = [...documentos]
    const alreadyHasComprovante = docsToSend.some(
      (d) => d.tipoDocumento === TIPO_DOCUMENTO_INSCRICAO_COMPROVANTE_MATRICULA
    )
    if (existingComprovante && !alreadyHasComprovante) {
      docsToSend.push({
        fileId: existingComprovante,
        tipoDocumento: TIPO_DOCUMENTO_INSCRICAO_COMPROVANTE_MATRICULA,
      })
    }

    try {
      const result = await criarMutation.mutateAsync({
        projetoId,
        tipoVagaPretendida: tipoVaga as "BOLSISTA" | "VOLUNTARIO",
        cursouComponente: cursouComponente === "sim",
        disciplinaEquivalenteId: disciplinaEquivalenteId ?? undefined,
        localAssinatura,
        signatureDataUrl: signatureDataUrl!,
        uploadedDocuments: docsToSend,
        profilePatch: {
          nomeCompleto: patch.nomeCompleto,
          nomeSocial: patch.nomeSocial || null,
          cpf: patch.cpf,
          rg: patch.rg,
          dataNascimento: patch.dataNascimento ? new Date(patch.dataNascimento) : undefined,
          genero: patch.genero,
          telefone: patch.telefone,
          telefoneFixo: patch.telefoneFixo || null,
          cursoNome: patch.cursoNome,
          banco: patch.banco || null,
          agencia: patch.agencia || null,
          conta: patch.conta || null,
          digitoConta: patch.digitoConta || null,
          endereco: patch.endereco
            ? {
                rua: patch.endereco.rua,
                numero: patch.endereco.numero ?? null,
                bairro: patch.endereco.bairro,
                cidade: patch.endereco.cidade,
                estado: patch.endereco.estado,
                cep: patch.endereco.cep,
                complemento: patch.endereco.complemento || null,
              }
            : undefined,
        },
      })
      toast({
        title: "Inscrição enviada!",
        description: "Seus documentos oficiais foram gerados com sucesso.",
      })
      router.push(`/home/student/minhas-inscricoes?success=${result.id}`)
    } catch (error) {
      toast({
        title: "Erro ao enviar inscrição",
        description: (error as Error).message ?? "Tente novamente",
        variant: "destructive",
      })
    }
  }

  if (projetoQuery.isLoading || profileQuery.isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!projeto) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-muted-foreground">Projeto não encontrado ou inscrições encerradas.</p>
          <Button className="mt-4" onClick={() => router.push("/home/student/inscricao-monitoria")}>
            Voltar
          </Button>
        </CardContent>
      </Card>
    )
  }

  const hasBolsas = (projeto.bolsasDisponibilizadas ?? 0) > 0
  const hasVoluntarios = (projeto.voluntariosSolicitados ?? 0) > 0
  const disciplinaPrincipal = (projeto as unknown as { disciplinas?: Array<{ codigo: string; nome: string }> }).disciplinas?.[0]

  return (
    <div className="space-y-6">
      {/* Project summary card */}
      <Card>
        <CardHeader>
          <CardTitle>{projeto.titulo}</CardTitle>
          <CardDescription>
            {projeto.departamentoNome} • Prof. {projeto.professorResponsavelNome}
            {disciplinaPrincipal ? ` • ${disciplinaPrincipal.codigo} - ${disciplinaPrincipal.nome}` : ""}
          </CardDescription>
        </CardHeader>
        <CardContent className="flex gap-4 text-sm text-muted-foreground">
          <span>{projeto.bolsasDisponibilizadas ?? 0} bolsas</span>
          <span>{projeto.voluntariosSolicitados ?? 0} voluntários</span>
          <span>{projeto.cargaHorariaSemana}h/semana</span>
        </CardContent>
      </Card>

      <Tabs value={currentStep} onValueChange={(v) => setCurrentStep(v as WizardStep)}>
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="dados">
            <UserCog className="h-4 w-4 mr-1" /> Dados
          </TabsTrigger>
          <TabsTrigger value="declaracao">
            <FileSignature className="h-4 w-4 mr-1" /> Declaração
          </TabsTrigger>
          <TabsTrigger value="documentos">
            <Upload className="h-4 w-4 mr-1" /> Documentos
          </TabsTrigger>
          <TabsTrigger value="assinatura">
            <PenTool className="h-4 w-4 mr-1" /> Assinatura
          </TabsTrigger>
          <TabsTrigger value="revisar">
            <CheckCircle2 className="h-4 w-4 mr-1" /> Revisar
          </TabsTrigger>
        </TabsList>

        {/* STEP 1: DADOS PESSOAIS */}
        <TabsContent value="dados">
          <Card>
            <CardHeader>
              <CardTitle>1. Dados pessoais</CardTitle>
              <CardDescription>Confira e complete os dados que vão constar no Anexo III/IV e Anexo I.</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Nome completo *</Label>
                <Input
                  value={patch.nomeCompleto ?? ""}
                  onChange={(e) => setPatch((p) => ({ ...p, nomeCompleto: e.target.value }))}
                />
              </div>
              <div>
                <Label>Nome social (opcional)</Label>
                <Input
                  value={patch.nomeSocial ?? ""}
                  onChange={(e) => setPatch((p) => ({ ...p, nomeSocial: e.target.value }))}
                />
              </div>
              <div>
                <Label>CPF *</Label>
                <Input value={patch.cpf ?? ""} onChange={(e) => setPatch((p) => ({ ...p, cpf: e.target.value }))} />
              </div>
              <div>
                <Label>RG *</Label>
                <Input value={patch.rg ?? ""} onChange={(e) => setPatch((p) => ({ ...p, rg: e.target.value }))} />
              </div>
              <div>
                <Label>Data de nascimento *</Label>
                <Input
                  type="date"
                  value={patch.dataNascimento ?? ""}
                  onChange={(e) => setPatch((p) => ({ ...p, dataNascimento: e.target.value }))}
                />
              </div>
              <div>
                <Label>Gênero</Label>
                <Select
                  value={patch.genero ?? ""}
                  onValueChange={(v) => setPatch((p) => ({ ...p, genero: v as typeof patch.genero }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={GENERO_FEMININO}>Feminino</SelectItem>
                    <SelectItem value={GENERO_MASCULINO}>Masculino</SelectItem>
                    <SelectItem value={GENERO_OUTRO}>Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Curso *</Label>
                <Input
                  value={patch.cursoNome ?? ""}
                  onChange={(e) => setPatch((p) => ({ ...p, cursoNome: e.target.value }))}
                />
              </div>
              <div>
                <Label>Telefone (celular) *</Label>
                <Input
                  value={patch.telefone ?? ""}
                  onChange={(e) => setPatch((p) => ({ ...p, telefone: e.target.value }))}
                />
              </div>
              <div>
                <Label>Telefone fixo</Label>
                <Input
                  value={patch.telefoneFixo ?? ""}
                  onChange={(e) => setPatch((p) => ({ ...p, telefoneFixo: e.target.value }))}
                />
              </div>

              <div className="md:col-span-2 border-t pt-4">
                <h4 className="font-medium mb-2">Endereço residencial *</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Label>Rua</Label>
                    <Input
                      value={patch.endereco?.rua ?? ""}
                      onChange={(e) =>
                        setPatch((p) => ({ ...p, endereco: { ...(p.endereco ?? ({} as never)), rua: e.target.value } }))
                      }
                    />
                  </div>
                  <div>
                    <Label>Número</Label>
                    <Input
                      type="number"
                      value={patch.endereco?.numero ?? ""}
                      onChange={(e) =>
                        setPatch((p) => ({
                          ...p,
                          endereco: {
                            ...(p.endereco ?? ({} as never)),
                            numero: e.target.value ? Number(e.target.value) : null,
                          },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label>Bairro</Label>
                    <Input
                      value={patch.endereco?.bairro ?? ""}
                      onChange={(e) =>
                        setPatch((p) => ({
                          ...p,
                          endereco: { ...(p.endereco ?? ({} as never)), bairro: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label>Cidade</Label>
                    <Input
                      value={patch.endereco?.cidade ?? ""}
                      onChange={(e) =>
                        setPatch((p) => ({
                          ...p,
                          endereco: { ...(p.endereco ?? ({} as never)), cidade: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label>Estado</Label>
                    <Input
                      value={patch.endereco?.estado ?? ""}
                      onChange={(e) =>
                        setPatch((p) => ({
                          ...p,
                          endereco: { ...(p.endereco ?? ({} as never)), estado: e.target.value },
                        }))
                      }
                    />
                  </div>
                  <div>
                    <Label>CEP</Label>
                    <Input
                      value={patch.endereco?.cep ?? ""}
                      onChange={(e) =>
                        setPatch((p) => ({ ...p, endereco: { ...(p.endereco ?? ({} as never)), cep: e.target.value } }))
                      }
                    />
                  </div>
                  <div className="col-span-2">
                    <Label>Complemento</Label>
                    <Input
                      value={patch.endereco?.complemento ?? ""}
                      onChange={(e) =>
                        setPatch((p) => ({
                          ...p,
                          endereco: { ...(p.endereco ?? ({} as never)), complemento: e.target.value },
                        }))
                      }
                    />
                  </div>
                </div>
              </div>

              {tipoVaga === "BOLSISTA" && (
                <div className="md:col-span-2 border-t pt-4">
                  <h4 className="font-medium mb-2">Dados bancários (apenas bolsista) *</h4>
                  <p className="text-xs text-muted-foreground mb-3">
                    Conta corrente de titularidade do monitor, não poupança, não conjunta.
                  </p>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="col-span-2">
                      <Label>Banco</Label>
                      <Input
                        value={patch.banco ?? ""}
                        onChange={(e) => setPatch((p) => ({ ...p, banco: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Agência</Label>
                      <Input
                        value={patch.agencia ?? ""}
                        onChange={(e) => setPatch((p) => ({ ...p, agencia: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Conta</Label>
                      <Input
                        value={patch.conta ?? ""}
                        onChange={(e) => setPatch((p) => ({ ...p, conta: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label>Dígito</Label>
                      <Input
                        value={patch.digitoConta ?? ""}
                        onChange={(e) => setPatch((p) => ({ ...p, digitoConta: e.target.value }))}
                      />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* STEP 2: DECLARAÇÃO */}
        <TabsContent value="declaracao">
          <Card>
            <CardHeader>
              <CardTitle>2. Tipo de vaga e declaração</CardTitle>
              <CardDescription>Escolha o tipo de vaga e declare se já cursou o componente.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              <div>
                <Label>Tipo de vaga pretendida *</Label>
                <Select value={tipoVaga} onValueChange={(v) => setTipoVaga(v as typeof tipoVaga)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    {hasBolsas && (
                      <SelectItem value={TIPO_VAGA_BOLSISTA}>
                        Bolsista ({projeto.bolsasDisponibilizadas} vaga(s))
                      </SelectItem>
                    )}
                    {hasVoluntarios && (
                      <SelectItem value={TIPO_VAGA_VOLUNTARIO}>
                        Voluntário ({projeto.voluntariosSolicitados} vaga(s))
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Declara ter cursado com aprovação o componente? *</Label>
                <RadioGroup value={cursouComponente} onValueChange={(v) => setCursouComponente(v as typeof cursouComponente)}>
                  <div className="flex gap-4 mt-2">
                    <label className="flex items-center gap-2">
                      <RadioGroupItem value="sim" /> Sim
                    </label>
                    <label className="flex items-center gap-2">
                      <RadioGroupItem value="nao" /> Não
                    </label>
                  </div>
                </RadioGroup>
              </div>

              {cursouComponente === "nao" && (
                <div>
                  <Label>Disciplina equivalente cursada *</Label>
                  <Input
                    placeholder="Digite o código ou nome da disciplina"
                    value={disciplinaEquivalenteQuery}
                    onChange={(e) => setDisciplinaEquivalenteQuery(e.target.value)}
                  />
                  <DisciplinaEquivalenteSearch
                    options={disciplinasQuery.data ?? []}
                    query={disciplinaEquivalenteQuery}
                    selectedId={disciplinaEquivalenteId}
                    onSelect={(d) => {
                      setDisciplinaEquivalenteId(d.id)
                      setDisciplinaEquivalenteQuery(`${d.codigo} - ${d.nome}`)
                    }}
                  />
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* STEP 3: DOCUMENTOS */}
        <TabsContent value="documentos">
          <Card>
            <CardHeader>
              <CardTitle>3. Documentos pessoais</CardTitle>
              <CardDescription>Envie os PDFs ou imagens solicitados. Os Anexos oficiais serão gerados automaticamente ao final.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <FileUploadField
                label="RG (PDF ou imagem)"
                accept=".pdf,.jpg,.jpeg,.png"
                entityType="inscricao-temp"
                entityId={tempEntityId}
                required
                onFileUploaded={(fileId) => setDoc(TIPO_DOCUMENTO_INSCRICAO_RG, fileId)}
                onFileDeleted={() => setDoc(TIPO_DOCUMENTO_INSCRICAO_RG, null)}
              />
              <FileUploadField
                label="CPF (PDF ou imagem)"
                accept=".pdf,.jpg,.jpeg,.png"
                entityType="inscricao-temp"
                entityId={tempEntityId}
                required
                onFileUploaded={(fileId) => setDoc(TIPO_DOCUMENTO_INSCRICAO_CPF, fileId)}
                onFileDeleted={() => setDoc(TIPO_DOCUMENTO_INSCRICAO_CPF, null)}
              />
              <FileUploadField
                label="Histórico Escolar da UFBA (PDF com autenticação digital)"
                accept=".pdf"
                entityType="inscricao-temp"
                entityId={tempEntityId}
                required
                currentFileId={profileQuery.data?.historicoEscolarFileId ?? null}
                onFileUploaded={(fileId) => setDoc(TIPO_DOCUMENTO_INSCRICAO_HISTORICO_ESCOLAR, fileId)}
                onFileDeleted={() => setDoc(TIPO_DOCUMENTO_INSCRICAO_HISTORICO_ESCOLAR, null)}
              />
              {profileQuery.data?.historicoEscolarFileId && !documentos.some((d) => d.tipoDocumento === TIPO_DOCUMENTO_INSCRICAO_HISTORICO_ESCOLAR) && (
                <p className="text-xs text-muted-foreground">
                  Um histórico já existe no seu perfil. Ele será usado automaticamente se você não enviar um novo.
                </p>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* STEP 4: ASSINATURA */}
        <TabsContent value="assinatura">
          <Card>
            <CardHeader>
              <CardTitle>4. Assinatura digital</CardTitle>
              <CardDescription>Sua assinatura será inserida nos Anexos gerados.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Local</Label>
                <Input value={localAssinatura} onChange={(e) => setLocalAssinatura(e.target.value)} />
              </div>
              <div>
                <Label>Assine abaixo *</Label>
                <div className="border-2 border-dashed rounded-lg bg-white mt-1">
                  <SignatureCanvas
                    ref={signatureRef}
                    canvasProps={{ width: 560, height: 180, className: "signature-canvas w-full" }}
                    backgroundColor="white"
                    onEnd={captureSignature}
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  <Button type="button" variant="outline" size="sm" onClick={clearSignature}>
                    Limpar
                  </Button>
                </div>
                {signatureDataUrl && (
                  <p className="text-xs text-green-700 mt-2">Assinatura capturada ✓</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* STEP 5: REVISAR */}
        <TabsContent value="revisar">
          <Card>
            <CardHeader>
              <CardTitle>5. Revisar e enviar</CardTitle>
              <CardDescription>Confirme os dados. Ao enviar, geramos automaticamente os Anexos I e {tipoVaga === "BOLSISTA" ? "III" : "IV"}.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground">Projeto:</span> {projeto.titulo}
              </div>
              <div>
                <span className="text-muted-foreground">Tipo de vaga:</span> {tipoVaga === "BOLSISTA" ? "Bolsista" : "Voluntário"}
              </div>
              <div>
                <span className="text-muted-foreground">Nome:</span> {patch.nomeCompleto}
              </div>
              <div>
                <span className="text-muted-foreground">Matrícula:</span> {profileQuery.data?.matricula}
              </div>
              <div>
                <span className="text-muted-foreground">Documentos enviados:</span> {documentos.length}
              </div>
              <div>
                <span className="text-muted-foreground">Cursou componente:</span> {cursouComponente === "sim" ? "Sim" : "Não (com equivalente)"}
              </div>
              <div>
                <span className="text-muted-foreground">Assinatura:</span> {signatureDataUrl ? "capturada ✓" : "pendente"}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Navigation */}
      <div className="flex justify-between items-center">
        <Button variant="outline" onClick={goPrev} disabled={currentStep === "dados"}>
          Voltar
        </Button>
        {currentStep === "revisar" ? (
          <Button onClick={handleSubmit} disabled={criarMutation.isPending}>
            {criarMutation.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : null}
            Enviar inscrição
          </Button>
        ) : (
          <Button onClick={handleStepAdvance}>Avançar</Button>
        )}
      </div>

    </div>
  )
}

interface DisciplinaEquivalenteSearchProps {
  options: Array<{ id: number; codigo: string; nome: string }>
  query: string
  selectedId: number | null
  onSelect: (d: { id: number; codigo: string; nome: string }) => void
}

function DisciplinaEquivalenteSearch({ options, query, selectedId, onSelect }: DisciplinaEquivalenteSearchProps) {
  const filtered = useMemo(() => {
    if (!query) return []
    const q = query.toLowerCase()
    return options.filter((d) => `${d.codigo} ${d.nome}`.toLowerCase().includes(q)).slice(0, 8)
  }, [options, query])

  if (!query || filtered.length === 0) return null

  return (
    <div className="border rounded-md mt-2 max-h-48 overflow-auto">
      {filtered.map((d) => (
        <button
          key={d.id}
          type="button"
          onClick={() => onSelect(d)}
          className={`w-full text-left px-3 py-2 hover:bg-muted text-sm ${selectedId === d.id ? "bg-muted font-medium" : ""}`}
        >
          {d.codigo} - {d.nome}
        </button>
      ))}
    </div>
  )
}
