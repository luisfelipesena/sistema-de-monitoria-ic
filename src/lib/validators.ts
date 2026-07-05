export const normalizeCPF = (cpf: string): string => cpf.replace(/\D/g, '')

export const isValidCPF = (cpf: string): boolean => {
  if (typeof cpf !== 'string') return false

  const cleanCpf = normalizeCPF(cpf)

  if (cleanCpf.length !== 11 || /^([0-9])\1{10}$/.test(cleanCpf)) return false

  const cpfDigits = cleanCpf.split('').map((el) => Number(el))

  const calculateCheckDigit = (length: number): number => {
    const sum = cpfDigits.slice(0, length).reduce((accumulator, digit, index) => {
      return accumulator + digit * (length + 1 - index)
    }, 0)

    const remainder = (sum * 10) % 11
    return remainder === 10 ? 0 : remainder
  }

  return calculateCheckDigit(9) === cpfDigits[9] && calculateCheckDigit(10) === cpfDigits[10]
}

export const getCPFValidationMessage = (cpf: string): string | null => {
  if (!cpf.trim()) return 'CPF é obrigatório'
  return isValidCPF(cpf) ? null : 'CPF inválido'
}

export const formatCPF = (cpf: string): string => {
  if (!cpf) return ''

  const cleanCpf = normalizeCPF(cpf)

  if (cleanCpf.length <= 3) {
    return cleanCpf
  }

  if (cleanCpf.length <= 6) {
    return `${cleanCpf.slice(0, 3)}.${cleanCpf.slice(3)}`
  }

  if (cleanCpf.length <= 9) {
    return `${cleanCpf.slice(0, 3)}.${cleanCpf.slice(3, 6)}.${cleanCpf.slice(6)}`
  }

  return `${cleanCpf.slice(0, 3)}.${cleanCpf.slice(3, 6)}.${cleanCpf.slice(6, 9)}-${cleanCpf.slice(9, 11)}`
}
