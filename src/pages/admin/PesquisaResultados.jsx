import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Download, Users, BarChart3 } from 'lucide-react'
import { PageTitle } from '../../components/ui/PageTitle'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { LoadingState } from '../../components/ui/LoadingState'
import { EmptyState } from '../../components/ui/EmptyState'
import { pesquisaAdminService } from '../../services/adminService'

export default function PesquisaResultados() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [dados, setDados] = useState(null)
  const [loading, setLoading] = useState(true)

  const carregar = useCallback(() => {
    setLoading(true)
    pesquisaAdminService.getResultados(id)
      .then(setDados)
      .catch(() => setDados(null))
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => { carregar() }, [carregar])

  if (loading) return <LoadingState />
  if (!dados) return (
    <div>
      <button onClick={() => navigate('/admin/pesquisas')} className="flex items-center gap-1.5 text-sm text-rp-cinza-medio hover:text-rp-azul mb-4"><ArrowLeft size={16} /> Voltar</button>
      <EmptyState icon={<BarChart3 size={44} />} title="Sem resultados" description="Não foi possível carregar os resultados desta pesquisa." />
    </div>
  )

  const { pesquisa, resultados = [], total_respondentes = 0 } = dados

  return (
    <div>
      <button onClick={() => navigate('/admin/pesquisas')} className="flex items-center gap-1.5 text-sm text-rp-cinza-medio hover:text-rp-azul mb-4"><ArrowLeft size={16} /> Voltar às pesquisas</button>

      <PageTitle
        title={pesquisa?.titulo || 'Resultados'}
        subtitle="Resultados da pesquisa"
        action={
          <a href={pesquisaAdminService.exportarUrl(id)} target="_blank" rel="noreferrer">
            <Button variant="outline"><Download size={14} /> Exportar CSV</Button>
          </a>
        }
      />

      <div className="flex items-center gap-3 mb-5">
        <Badge label={(pesquisa?.status || '').toUpperCase()} variant={pesquisa?.status} />
        <span className="flex items-center gap-1.5 text-sm text-rp-cinza-medio"><Users size={15} /> {total_respondentes} respondente(s)</span>
      </div>

      {resultados.length === 0 ? (
        <EmptyState icon={<BarChart3 size={44} />} title="Sem respostas ainda" description="Assim que os colaboradores responderem, os resultados aparecem aqui." />
      ) : (
        <div className="space-y-3">
          {resultados.map((r, i) => {
            const maxCount = Math.max(1, ...(r.distribuicao ?? []).map((d) => d.count))
            const numerica = ['likert', 'nps'].includes(r.tipo)
            return (
              <div key={r.pergunta_id} className="bg-white rounded-xl shadow-card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-rp-texto">
                      <span className="text-rp-cinza-medio mr-1">{i + 1}.</span>{r.texto}
                    </p>
                    {r.dimensao && <span className="inline-block mt-1 text-[11px] text-rp-azul bg-rp-azul-suave px-2 py-0.5 rounded-full">{r.dimensao}</span>}
                  </div>
                  <div className="text-right flex-shrink-0">
                    {numerica && <p className="text-xl font-bold text-rp-azul">{r.media}</p>}
                    <p className="text-[11px] text-rp-cinza-medio">{r.total} resposta(s)</p>
                  </div>
                </div>

                {(r.distribuicao ?? []).length > 0 && (
                  <div className="mt-4 space-y-1.5">
                    {r.distribuicao.map((d) => (
                      <div key={d.valor} className="flex items-center gap-2">
                        <span className="text-xs text-rp-cinza-medio w-8 text-right">{d.valor}</span>
                        <div className="flex-1 bg-rp-cinza-borda rounded-full h-3 overflow-hidden">
                          <div className="h-full bg-rp-azul rounded-full" style={{ width: `${(d.count / maxCount) * 100}%` }} />
                        </div>
                        <span className="text-xs text-rp-texto w-8">{d.count}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
