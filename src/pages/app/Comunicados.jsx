import { useState, useEffect } from 'react'
import { Bell, ChevronDown, ChevronUp } from 'lucide-react'
import { comunicadoService } from '../../services/appService'

const tipoColor = {
  urgente: { bg: 'bg-orange-50', icon: 'text-rp-laranja' },
  alerta: { bg: 'bg-yellow-50', icon: 'text-yellow-600' },
  info: { bg: 'bg-rp-azul-suave', icon: 'text-rp-azul' }
}

export default function Comunicados() {
  const [comunicados, setComunicados] = useState([])
  const [expanded, setExpanded] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    comunicadoService.listar()
      .then(setComunicados)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  async function handleExpand(id) {
    const isOpening = expanded !== id
    setExpanded(isOpening ? id : null)

    if (isOpening) {
      const comunicado = comunicados.find((c) => c.id === id)
      if (comunicado && !comunicado.lido) {
        try {
          await comunicadoService.marcarLido(id)
          setComunicados((prev) =>
            prev.map((c) => c.id === id ? { ...c, lido: true } : c)
          )
        } catch (_) {}
      }
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-rp-cinza-claro flex items-center justify-center">
        <p className="text-sm text-rp-cinza-medio">Carregando...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-rp-cinza-claro">
      <div className="bg-white px-5 pt-6 pb-4 border-b border-rp-cinza-borda">
        <h1 className="text-xl font-bold text-rp-azul">Comunicados</h1>
        <p className="text-xs text-rp-cinza-medio mt-0.5">Informações da sua empresa</p>
      </div>

      <div className="px-4 py-4 space-y-3">
        {comunicados.length === 0 && (
          <div className="bg-white rounded-xl p-8 shadow-card text-center">
            <Bell size={32} className="text-rp-cinza-medio mx-auto mb-3" />
            <p className="text-sm text-rp-cinza-medio">Nenhum comunicado disponível.</p>
          </div>
        )}

        {comunicados.map((c) => {
          const cores = tipoColor[c.tipo] || tipoColor.info
          return (
            <div
              key={c.id}
              className={`bg-white rounded-xl shadow-card overflow-hidden transition-all ${!c.lido ? 'ring-1 ring-rp-azul/20' : ''}`}
            >
              <button
                className="w-full text-left p-4"
                onClick={() => handleExpand(c.id)}
              >
                <div className="flex items-start gap-3">
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${cores.bg}`}>
                    <Bell size={16} className={cores.icon} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[10px] font-bold uppercase tracking-widest text-rp-cinza-medio mb-0.5">
                          {c.tipo} · {new Date(c.criado_em).toLocaleDateString('pt-BR')}
                        </p>
                        <p className={`text-sm font-semibold ${!c.lido ? 'text-rp-azul' : 'text-rp-texto'}`}>
                          {c.titulo}
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        {!c.lido && <span className="w-2 h-2 rounded-full bg-rp-azul" />}
                        {expanded === c.id
                          ? <ChevronUp size={14} className="text-rp-cinza-medio" />
                          : <ChevronDown size={14} className="text-rp-cinza-medio" />
                        }
                      </div>
                    </div>
                  </div>
                </div>
              </button>

              {expanded === c.id && (
                <div className="px-4 pb-4 pt-0 border-t border-rp-cinza-borda mt-0">
                  <p className="text-sm text-rp-texto leading-relaxed pt-3">{c.corpo}</p>
                  {c.tipo === 'urgente' && (
                    <div className="mt-3 inline-flex items-center gap-1 bg-orange-50 text-orange-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                      Urgente
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
