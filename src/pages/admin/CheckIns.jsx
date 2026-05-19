import { useState, useEffect } from 'react'
import { Heart, TrendingUp, Calendar } from 'lucide-react'
import { PageTitle } from '../../components/ui/PageTitle'
import { EvolutionChart } from '../../components/charts/EvolutionChart'
import { checkInAdminService } from '../../services/adminService'

export default function CheckIns() {
  const [resumo, setResumo] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    checkInAdminService.resumo()
      .then(setResumo)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const mediaHumor = resumo?.media_humor ?? '—'
  const taxaParticipacao = resumo?.participacao ?? '—'
  const totalRecebido = resumo?.total_recebido ?? '—'
  const distribuicao = resumo?.distribuicao ?? {}
  const historico = resumo?.historico ?? []
  const evolucao = resumo?.evolucao ?? []

  return (
    <div>
      <PageTitle title="Check-ins" subtitle="Monitoramento semanal do humor organizacional" />

      {loading ? (
        <div className="py-12 text-center">
          <p className="text-sm text-rp-cinza-medio">Carregando dados...</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-3 gap-4 mb-5">
            <div className="bg-white rounded-xl p-5 shadow-card">
              <div className="w-10 h-10 rounded-xl bg-rp-azul-suave flex items-center justify-center mb-3">
                <Heart size={18} className="text-rp-azul" strokeWidth={1.8} />
              </div>
              <p className="text-2xl font-bold text-rp-azul">{mediaHumor}</p>
              <p className="text-xs text-rp-cinza-medio mt-1">Média desta semana</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-card">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center mb-3">
                <TrendingUp size={18} className="text-green-600" strokeWidth={1.8} />
              </div>
              <p className="text-2xl font-bold text-rp-azul">
                {taxaParticipacao}{typeof taxaParticipacao === 'number' ? '%' : ''}
              </p>
              <p className="text-xs text-rp-cinza-medio mt-1">Taxa de resposta semanal</p>
            </div>
            <div className="bg-white rounded-xl p-5 shadow-card">
              <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center mb-3">
                <Calendar size={18} className="text-rp-laranja" strokeWidth={1.8} />
              </div>
              <p className="text-2xl font-bold text-rp-azul">{totalRecebido}</p>
              <p className="text-xs text-rp-cinza-medio mt-1">Check-ins esta semana</p>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-white rounded-xl p-5 shadow-card">
              <h3 className="text-base font-bold text-rp-azul mb-1">Evolução dos check-ins</h3>
              <p className="text-xs text-rp-cinza-medio mb-4">últimas 6 semanas · média de humor (1–5)</p>
              <EvolutionChart data={evolucao} />
            </div>

            <div className="bg-white rounded-xl p-5 shadow-card">
              <h3 className="text-base font-bold text-rp-azul mb-4">Histórico semanal</h3>
              {historico.length === 0 ? (
                <p className="text-sm text-rp-cinza-medio text-center py-4">Nenhum histórico disponível.</p>
              ) : (
                <div className="space-y-3">
                  {historico.map((c) => (
                    <div key={c.semana ?? c.periodo} className="flex items-center justify-between py-2 border-b border-rp-cinza-borda last:border-0">
                      <div>
                        <p className="text-sm font-semibold text-rp-texto">{c.semana}</p>
                        <p className="text-xs text-rp-cinza-medio">{c.data ?? c.periodo}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-rp-azul">{c.pct ?? c.taxa_participacao}%</p>
                        <p className="text-xs text-rp-cinza-medio">média {c.media ?? c.media_humor}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}
