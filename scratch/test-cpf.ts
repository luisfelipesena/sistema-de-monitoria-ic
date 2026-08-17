import { isValidCPF } from '../src/lib/validators'

function getValidCPF() {
  const base = '123456789'
  const digits = base.split('').map(Number)

  const calculateCheckDigit = (length: number): number => {
    const sum = digits.slice(0, length).reduce((accumulator, digit, index) => {
      return accumulator + digit * (length + 1 - index)
    }, 0)

    const remainder = (sum * 10) % 11
    return remainder === 10 ? 0 : remainder
  }

  const d1 = calculateCheckDigit(9)
  digits.push(d1)
  const d2 = calculateCheckDigit(10)

  const valid = `${base}${d1}${d2}`
  console.log(`Base: ${base}, check digits: ${d1}${d2}, valid CPF: ${valid}`)
  console.log('Check if valid:', isValidCPF(valid))
}

getValidCPF()
process.exit(0)
