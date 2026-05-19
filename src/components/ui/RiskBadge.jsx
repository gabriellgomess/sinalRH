import { getRiskColor } from '../../utils/formatters'

export function RiskBadge({ nivel, className = '' }) {
  const { bg, text, label } = getRiskColor(nivel)
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold tracking-wide ${className}`}
      style={{ backgroundColor: bg, color: text }}
    >
      {label}
    </span>
  )
}
