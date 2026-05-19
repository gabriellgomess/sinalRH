import { getScoreBarColor } from '../../utils/formatters'

export function ProgressBar({ value, max = 100, color, showLabel = false, height = 'h-2', className = '' }) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))
  const barColor = color || getScoreBarColor(pct)

  return (
    <div className={`w-full ${className}`}>
      <div className={`w-full bg-rp-cinza-borda rounded-full ${height} overflow-hidden`}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ width: `${pct}%`, backgroundColor: barColor }}
        />
      </div>
      {showLabel && (
        <span className="text-xs text-rp-cinza-medio mt-1">{Math.round(pct)}%</span>
      )}
    </div>
  )
}
