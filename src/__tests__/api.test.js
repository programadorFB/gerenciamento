/**
 * Testes do serviço de API (src/services/api.js)
 * Usa mock do axios para testar lógica sem chamadas reais.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import axios from 'axios'

// Mock do axios
vi.mock('axios', () => {
  const instance = {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
    defaults: { headers: { common: {} } },
  }
  return {
    default: { create: vi.fn(() => instance), ...instance },
    create: vi.fn(() => instance),
  }
})

// Importa DEPOIS do mock
let apiService
beforeEach(async () => {
  vi.resetModules()
  localStorage.clear()
  const mod = await import('../services/api.js')
  apiService = mod.default
})

describe('apiService', () => {
  describe('TRANSACTION_TYPES', () => {
    it('define os 4 tipos de transação', () => {
      expect(apiService.TRANSACTION_TYPES).toEqual({
        DEPOSIT: 'deposit',
        WITHDRAW: 'withdraw',
        GAINS: 'gains',
        LOSSES: 'losses',
      })
    })
  })

  describe('Token management', () => {
    it('setAuthToken salva no localStorage', () => {
      apiService.setAuthToken('abc123')
      expect(localStorage.getItem('auth_token')).toBe('abc123')
    })

    it('getAuthToken retorna o token salvo', () => {
      localStorage.setItem('auth_token', 'xyz')
      expect(apiService.getAuthToken()).toBe('xyz')
    })

    it('clearAuthToken remove o token', () => {
      localStorage.setItem('auth_token', 'abc')
      apiService.clearAuthToken()
      expect(localStorage.getItem('auth_token')).toBeNull()
    })
  })

  describe('validateInitialBank', () => {
    it('aceita valor válido', () => {
      const result = apiService.validateInitialBank(500)
      expect(result.isValid).toBe(true)
      expect(result.amount).toBe(500)
    })

    it('rejeita zero', () => {
      const result = apiService.validateInitialBank(0)
      expect(result.isValid).toBe(false)
    })

    it('rejeita valor negativo', () => {
      const result = apiService.validateInitialBank(-100)
      expect(result.isValid).toBe(false)
    })

    it('rejeita valor acima do máximo', () => {
      const result = apiService.validateInitialBank(9999999)
      expect(result.isValid).toBe(false)
    })

    it('aceita string numérica com vírgula', () => {
      const result = apiService.validateInitialBank('1.500,50')
      expect(result.isValid).toBe(true)
    })
  })

  describe('validateTransaction', () => {
    it('transação válida', () => {
      const result = apiService.validateTransaction({
        type: 'deposit',
        amount: 100,
        date: '2026-03-15',
      })
      expect(result.isValid).toBe(true)
    })

    it('tipo inválido', () => {
      const result = apiService.validateTransaction({
        type: 'invalid',
        amount: 100,
        date: '2026-03-15',
      })
      expect(result.isValid).toBe(false)
    })

    it('valor zero', () => {
      const result = apiService.validateTransaction({
        type: 'deposit',
        amount: 0,
        date: '2026-03-15',
      })
      expect(result.isValid).toBe(false)
    })

    it('sem data', () => {
      const result = apiService.validateTransaction({
        type: 'deposit',
        amount: 100,
      })
      expect(result.isValid).toBe(false)
    })
  })

  describe('formatCurrency', () => {
    it('formata BRL corretamente', () => {
      const result = apiService.formatCurrency(1500.5)
      expect(result).toContain('R$')
      expect(result).toContain('1.500,50')
    })

    it('retorna vazio para NaN', () => {
      expect(apiService.formatCurrency('abc')).toBe('')
    })
  })

  describe('parseCurrencyInput', () => {
    it('converte string com vírgula decimal', () => {
      expect(apiService.parseCurrencyInput('500,50')).toBe(500.5)
    })

    it('retorna 0 para entrada vazia', () => {
      expect(apiService.parseCurrencyInput('')).toBe(0)
    })

    it('retorna 0 para null', () => {
      expect(apiService.parseCurrencyInput(null)).toBe(0)
    })
  })

  describe('Helpers de tipo', () => {
    it('isOperationalTransaction identifica gains/losses', () => {
      expect(apiService.isOperationalTransaction('gains')).toBe(true)
      expect(apiService.isOperationalTransaction('losses')).toBe(true)
      expect(apiService.isOperationalTransaction('deposit')).toBe(false)
    })

    it('isCashFlowTransaction identifica deposit/withdraw', () => {
      expect(apiService.isCashFlowTransaction('deposit')).toBe(true)
      expect(apiService.isCashFlowTransaction('withdraw')).toBe(true)
      expect(apiService.isCashFlowTransaction('gains')).toBe(false)
    })
  })

  describe('calculateRealProfit', () => {
    it('calcula lucro real (gains - losses)', () => {
      const transactions = [
        { type: 'gains', amount: 500 },
        { type: 'gains', amount: 300 },
        { type: 'losses', amount: 200 },
        { type: 'deposit', amount: 1000 },
      ]
      expect(apiService.calculateRealProfit(transactions)).toBe(600)
    })

    it('retorna 0 para lista vazia', () => {
      expect(apiService.calculateRealProfit([])).toBe(0)
    })
  })

  describe('calculatePerformanceMetrics', () => {
    it('calcula todas as métricas', () => {
      const transactions = [
        { type: 'gains', amount: 100 },
        { type: 'gains', amount: 200 },
        { type: 'losses', amount: 50 },
      ]
      const metrics = apiService.calculatePerformanceMetrics(transactions)

      expect(metrics.totalGains).toBe(300)
      expect(metrics.totalLosses).toBe(50)
      expect(metrics.realProfit).toBe(250)
      expect(metrics.totalTrades).toBe(3)
      expect(metrics.winningTrades).toBe(2)
      expect(metrics.losingTrades).toBe(1)
      expect(metrics.winRate).toBeCloseTo(66.67, 1)
      expect(metrics.avgGain).toBe(150)
      expect(metrics.avgLoss).toBe(50)
      expect(metrics.profitFactor).toBe(6)
    })

    it('lida com lista sem perdas (profitFactor = Infinity)', () => {
      const transactions = [{ type: 'gains', amount: 100 }]
      const metrics = apiService.calculatePerformanceMetrics(transactions)
      expect(metrics.profitFactor).toBe(Infinity)
    })

    it('lida com lista vazia', () => {
      const metrics = apiService.calculatePerformanceMetrics([])
      expect(metrics.totalTrades).toBe(0)
      expect(metrics.winRate).toBe(0)
      expect(metrics.profitFactor).toBe(0)
    })
  })

  describe('getDefaultDescription', () => {
    it('retorna descrição para cada tipo', () => {
      expect(apiService.getDefaultDescription('deposit')).toContain('Depósito')
      expect(apiService.getDefaultDescription('withdraw')).toContain('Saque')
      expect(apiService.getDefaultDescription('gains')).toContain('Ganhos')
      expect(apiService.getDefaultDescription('losses')).toContain('Perdas')
      expect(apiService.getDefaultDescription('unknown')).toBe('Transação')
    })
  })

  describe('getDefaultCategory', () => {
    it('retorna categoria para cada tipo', () => {
      expect(apiService.getDefaultCategory('deposit')).toBe('Depósito')
      expect(apiService.getDefaultCategory('withdraw')).toBe('Saque')
      expect(apiService.getDefaultCategory('gains')).toBe('Ganhos')
      expect(apiService.getDefaultCategory('losses')).toBe('Perdas')
      expect(apiService.getDefaultCategory('unknown')).toBe('Geral')
    })
  })
})
