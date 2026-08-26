import { describe, expect, it } from 'vitest'
import { BANCOS_BRASIL, validarAgencia, validarConta } from './bancos-brasil'

describe('bancos-brasil', () => {
  describe('BANCOS_BRASIL', () => {
    it('should have a list of banks', () => {
      expect(BANCOS_BRASIL.length).toBeGreaterThan(50)
    })

    it('should include major banks', () => {
      const codigos = BANCOS_BRASIL.map((b) => b.codigo)
      expect(codigos).toContain('001') // Banco do Brasil
      expect(codigos).toContain('104') // Caixa
      expect(codigos).toContain('237') // Bradesco
      expect(codigos).toContain('341') // Itaú
      expect(codigos).toContain('033') // Santander
      expect(codigos).toContain('260') // Nubank
    })

    it('each bank should have codigo and nome', () => {
      for (const banco of BANCOS_BRASIL) {
        expect(banco.codigo).toBeDefined()
        expect(banco.nome).toBeDefined()
        expect(banco.codigo.length).toBeGreaterThanOrEqual(3)
        expect(banco.nome.length).toBeGreaterThan(0)
      }
    })
  })

  describe('validarAgencia', () => {
    it('should accept valid agencias', () => {
      expect(validarAgencia('1234')).toBe(true)
      expect(validarAgencia('123')).toBe(true)
      expect(validarAgencia('12345')).toBe(true)
      expect(validarAgencia('123456')).toBe(true)
    })

    it('should accept agencias with separator characters', () => {
      expect(validarAgencia('1234-5')).toBe(true)
      expect(validarAgencia('1234/5')).toBe(true)
    })

    it('should reject too short agencias', () => {
      expect(validarAgencia('12')).toBe(false)
      expect(validarAgencia('1')).toBe(false)
      expect(validarAgencia('')).toBe(false)
    })

    it('should reject too long agencias', () => {
      expect(validarAgencia('1234567')).toBe(false)
    })
  })

  describe('validarConta', () => {
    it('should accept valid contas', () => {
      expect(validarConta('12345')).toBe(true)
      expect(validarConta('1234')).toBe(true)
      expect(validarConta('123456789')).toBe(true)
      expect(validarConta('1234567890123')).toBe(true)
    })

    it('should accept contas with separator characters', () => {
      expect(validarConta('12345-6')).toBe(true)
      expect(validarConta('123456-7')).toBe(true)
    })

    it('should reject too short contas', () => {
      expect(validarConta('123')).toBe(false)
      expect(validarConta('12')).toBe(false)
      expect(validarConta('')).toBe(false)
    })

    it('should reject too long contas', () => {
      expect(validarConta('12345678901234')).toBe(false)
    })
  })
})
