import { getScoreBarColor } from '../../utils/formatters'

export function SectorChart({ data, onSelect, selected }) {
  return (
    <div className="space-y-2.5">
      {data.map((item) => {
        const color = getScoreBarColor(item.score)
        const isSelected = selected === item.nome
        return (
          <div
            key={item.nome}
            className={`flex items-center gap-3 cursor-pointer rounded-lg px-2 py-1 -mx-2 transition-colors ${isSelected ? 'bg-rp-azul-suave' : 'hover:bg-rp-cinza-claro'}`}
            onClick={() => onSelect && onSelect(item.nome)}
          >
            <span className="text-sm text-rp-texto font-medium w-32 flex-shrink-0 truncate">{item.nome}</span>
            <div className="flex-1 bg-rp-cinza-borda rounded-full h-2 overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${item.score}%`, backgroundColor: color }}
              />
            </div>
            <span className="text-sm font-semibold text-rp-texto w-10 text-right flex-shrink-0">{item.score}%</span>
          </div>
        )
      })}
    </div>
  )
}
