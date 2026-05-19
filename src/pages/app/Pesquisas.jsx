import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ChevronRight, ClipboardList, CheckCircle } from 'lucide-react'
import { pesquisaAppService } from '../../services/appService'
import { formatDate } from '../../utils/formatters'

export default function Pesquisas() {
  const navigate = useNavigate()
  const [pesquisas, setPesquisas] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    pesquisaAppService.listar()
      .then(setPesquisas)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const disponiveis = pesquisas.filter((p) => !p.respondeu)
  const respondidas = pesquisas.filter((p) => p.respondeu)

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
        <h1 className="text-xl font-bold text-rp-azul">Pesquisas</h1>
        <p className="text-xs text-rp-cinza-medio mt-0.5">Responda e contribua com sua empresa</p>
      </div>

      <div className="px-4 py-4 space-y-4">
        {disponiveis.length > 0 && (
          <div>
            <p className="text-xs font-bold text-rp-laranja uppercase tracking-widest mb-2 px-1">
              Disponíveis · {disponiveis.length}
            </p>
            <div className="space-y-3">
              {disponiveis.map((p) => (
                <div
                  key={p.id}
                  className="bg-white rounded-xl p-4 shadow-card cursor-pointer"
                  onClick={() => navigate(`/app/pesquisas/${p.id}`)}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-xl bg-rp-azul-suave flex items-center justify-center flex-shrink-0">
                      <ClipboardList size={18} className="text-rp-azul" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-rp-texto">{p.titulo}</p>
                      <p className="text-xs text-rp-cinza-medio mt-0.5">
                        {p.perguntas_count} perguntas
                        {p.prazo && ` · até ${formatDate(p.prazo)}`}
                      </p>
                    </div>
                    <ChevronRight size={16} className="text-rp-cinza-medio flex-shrink-0 mt-1" />
                  </div>
                  <div className="mt-3 pt-3 border-t border-rp-cinza-borda flex items-center justify-between">
                    <span className="text-xs text-rp-cinza-medio capitalize">Tipo: {p.tipo}</span>
                    <span className="text-xs font-semibold text-rp-laranja">Responder →</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {respondidas.length > 0 && (
          <div>
            <p className="text-xs font-bold text-rp-cinza-medio uppercase tracking-widest mb-2 px-1">
              Respondidas · {respondidas.length}
            </p>
            <div className="space-y-2">
              {respondidas.map((p) => (
                <div key={p.id} className="bg-white rounded-xl p-4 shadow-card opacity-70">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                      <CheckCircle size={16} className="text-green-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-rp-texto">{p.titulo}</p>
                      <p className="text-xs text-rp-cinza-medio mt-0.5">
                        Respondida · {p.perguntas_count} perguntas
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-green-600 bg-green-100 px-2 py-0.5 rounded-full">Respondida</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {pesquisas.length === 0 && (
          <div className="bg-white rounded-xl p-8 shadow-card text-center">
            <ClipboardList size={32} className="text-rp-cinza-medio mx-auto mb-3" />
            <p className="text-sm font-semibold text-rp-texto">Nenhuma pesquisa disponível</p>
            <p className="text-xs text-rp-cinza-medio mt-1">Novas pesquisas aparecerão aqui quando forem publicadas.</p>
          </div>
        )}
      </div>
    </div>
  )
}
