import { render, screen } from '@testing-library/react'
import { RiskBadge } from './RiskBadge'

describe('RiskBadge Component', () => {
  it('renders correctly with different levels', () => {
    const { rerender } = render(<RiskBadge nivel="critico" />)
    expect(screen.getByText('CRÍTICO')).toBeInTheDocument()

    rerender(<RiskBadge nivel="alto" />)
    expect(screen.getByText('ALTO')).toBeInTheDocument()

    rerender(<RiskBadge nivel="moderado" />)
    expect(screen.getByText('MODERADO')).toBeInTheDocument()

    rerender(<RiskBadge nivel="baixo" />)
    expect(screen.getByText('BAIXO')).toBeInTheDocument()
  })

  it('renders fallback for unknown or empty levels', () => {
    const { rerender } = render(<RiskBadge nivel="sem_dados" />)
    expect(screen.getByText('S/ DADOS')).toBeInTheDocument()

    rerender(<RiskBadge nivel="unknown" />)
    expect(screen.getByText('—')).toBeInTheDocument()
  })
})
