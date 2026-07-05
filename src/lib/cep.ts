export type CepAddress = {
  rua: string
  bairro: string
  cidade: string
  estado: string
  complemento?: string
}

export function normalizeCep(value: string) {
  return value.replace(/\D/g, '')
}

export function formatCep(value: string) {
  const digits = normalizeCep(value).slice(0, 8)

  if (digits.length <= 5) return digits
  return `${digits.slice(0, 5)}-${digits.slice(5)}`
}

export async function lookupCep(cep: string): Promise<CepAddress | null> {
  const normalizedCep = normalizeCep(cep)

  if (normalizedCep.length !== 8) {
    return null
  }

  const response = await fetch(`https://viacep.com.br/ws/${normalizedCep}/json/`)

  if (!response.ok) {
    return null
  }

  const data = (await response.json()) as {
    erro?: boolean
    logradouro?: string
    bairro?: string
    localidade?: string
    uf?: string
    complemento?: string
  }

  if (data.erro) {
    return null
  }

  return {
    rua: data.logradouro ?? '',
    bairro: data.bairro ?? '',
    cidade: data.localidade ?? '',
    estado: data.uf ?? '',
    complemento: data.complemento ?? '',
  }
}
