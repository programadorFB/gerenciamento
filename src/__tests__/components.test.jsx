/**
 * Testes de componentes React (renderização e props).
 */
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import React from 'react'
import BalanceSection from '../components/BalanceSection'

const formatCurrency = (val) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0)

describe('BalanceSection', () => {
  it('renderiza saldo inicial, saldo atual e lucro', () => {
    render(
      <BalanceSection
        initialBankBalance={1000}
        balance={1500}
        overallProfit={500}
        currentObjective={null}
        formatCurrency={formatCurrency}
      />
    )

    expect(screen.getByText('R$ 1.000,00')).toBeInTheDocument()
    expect(screen.getByText('R$ 1.500,00')).toBeInTheDocument()
    expect(screen.getByText(/R\$ 500,00/)).toBeInTheDocument()
  })

  it('mostra objetivo quando definido', () => {
    render(
      <BalanceSection
        initialBankBalance={1000}
        balance={1000}
        overallProfit={0}
        currentObjective={{ title: 'Comprar PC', target_amount: 5000 }}
        formatCurrency={formatCurrency}
      />
    )

    expect(screen.getByText('Comprar PC')).toBeInTheDocument()
    expect(screen.getByText('R$ 5.000,00')).toBeInTheDocument()
  })

  it('mostra "--" quando sem objetivo', () => {
    render(
      <BalanceSection
        initialBankBalance={1000}
        balance={1000}
        overallProfit={0}
        currentObjective={null}
        formatCurrency={formatCurrency}
      />
    )

    expect(screen.getByText('--')).toBeInTheDocument()
  })

  it('aplica cor verde para lucro positivo', () => {
    const { container } = render(
      <BalanceSection
        initialBankBalance={1000}
        balance={1500}
        overallProfit={500}
        currentObjective={null}
        formatCurrency={formatCurrency}
      />
    )

    const perfDiv = container.querySelector('.performance')
    expect(perfDiv.style.color).toBe('rgb(76, 175, 80)')  // #4CAF50
  })

  it('aplica cor vermelha para prejuízo', () => {
    const { container } = render(
      <BalanceSection
        initialBankBalance={1000}
        balance={800}
        overallProfit={-200}
        currentObjective={null}
        formatCurrency={formatCurrency}
      />
    )

    const perfDiv = container.querySelector('.performance')
    expect(perfDiv.style.color).toBe('rgb(244, 67, 54)')  // #F44336
  })
})
