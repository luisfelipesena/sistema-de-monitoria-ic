"use client"

export const dynamic = 'force-dynamic'

import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { Suspense, useEffect, useRef, useState } from "react"

import { Button } from "@/components/ui/button"
import { useAuth } from "@/hooks/use-auth"

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const token = searchParams.get("token")
  const { confirmEmail, resendVerification, errors, clearErrors } = useAuth()
  const [message, setMessage] = useState<string | null>(null)
  const [email, setEmail] = useState<string>("")
  const confirmEmailRef = useRef(confirmEmail)
  const clearErrorsRef = useRef(clearErrors)

  useEffect(() => {
    confirmEmailRef.current = confirmEmail
    clearErrorsRef.current = clearErrors
  }, [confirmEmail, clearErrors])

  useEffect(() => {
    if (!token) {
      setMessage(null)
      clearErrorsRef.current()
      return
    }

    let isActive = true
    setMessage(null)
    clearErrorsRef.current()

    confirmEmailRef
      .current(token)
      .then(() => {
        if (isActive) {
          setMessage("E-mail verificado com sucesso. Você já pode fazer login.")
        }
      })
      .catch(() => {
        if (isActive) {
          setMessage(null)
        }
      })

    return () => {
      isActive = false
    }
  }, [token])

  useEffect(() => {
    return () => {
      clearErrorsRef.current()
    }
  }, [])

  return (
    <div className="space-y-8">
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-slate-900">Confirme seu e-mail</h1>
        <p className="text-sm text-slate-600">
          Enviamos um e-mail com o link de confirmação para o endereço que você cadastrou. Basta acessá-lo para ativar
          seu acesso ao Sistema de Monitoria IC.
        </p>
      </div>

      <div className="rounded-lg border border-slate-200 bg-white p-6 space-y-6">
        {token ? (
          <div className="space-y-4">
            {message ? <p className="text-sm text-green-600">{message}</p> : null}
            {errors ? <p className="text-sm text-red-600">{errors}</p> : null}

            <Button asChild className="w-full">
              <Link href="/auth/login">Ir para login</Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-slate-600">
              Não recebeu o e-mail? Informe seu endereço para reenviarmos a confirmação.
            </p>
            <div className="flex gap-2">
              <input
                type="email"
                className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm"
                placeholder="nome@ufba.br"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
              <Button type="button" variant="secondary" onClick={() => resendVerification({ email })} disabled={!email}>
                Reenviar
              </Button>
            </div>
            {errors ? <p className="text-sm text-red-600">{errors}</p> : null}
            {message ? <p className="text-sm text-green-600">{message}</p> : null}
          </div>
        )}
      </div>

      <div className="text-sm text-slate-500 space-y-2">
        <p>• O link expira em 24 horas. Caso expire, você pode solicitar um novo.</p>
        <p>• Verifique também a caixa de spam do seu e-mail institucional.</p>
      </div>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<p className="text-sm text-slate-500">Carregando status da verificação...</p>}>
      <VerifyEmailContent />
    </Suspense>
  )
}
