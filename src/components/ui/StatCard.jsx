import { TrendingUp, TrendingDown, Minus } from 'lucide-react'

export function StatCard({ icon, label, value, unit, variacao, variacaoLabel, className = '' }) {
  const isPositive = variacao > 0
  const isNegative = variacao < 0
  const isNeutral = variacao === 0 || variacao == null

  return (
    <div className={`bg-white rounded-xl p-5 shadow-card ${className}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="w-10 h-10 rounded-xl bg-rp-azul-suave flex items-center justify-center text-rp-azul">
          {icon}
        </div>
        {!isNeutral && (
          <div className={`flex items-center gap-1 text-xs font-semibold ${isPositive ? 'text-green-600' : 'text-red-500'}`}>
            {isPositive ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
            <span>{isPositive ? '+' : ''}{variacaoLabel || variacao}</span>
          </div>
        )}
      </div>
      <div className="flex items-end gap-1">
        <span className="text-[28px] font-bold text-rp-azul leading-none">{value}</span>
        {unit && <span className="text-sm text-rp-cinza-medio mb-0.5">{unit}</span>}
      </div>
      <p className="text-xs text-rp-cinza-medio mt-1 font-medium">{label}</p>
    </div>
  )
}
