import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Heart, Users, Shield, AlertTriangle, Sparkles, X, ChevronRight, Package } from 'lucide-react'
import { StatCard } from '../../components/ui/StatCard'
import { EvolutionChart } from '../../components/charts/EvolutionChart'
import { SectorChart } from '../../components/charts/SectorChart'
import { PageTitle } from '../../components/ui/PageTitle'
import { Button } from '../../components/ui/Button'
import { dashboardService, produtosContratadosService } from '../../services/adminService'
import { relativeTime } from '../../utils/formatters'

const STATUS_PRODUTO_CLS = {
  ativo:        'bg-green-100 text-green-700',
  pausado:      'bg-yellow-100 text-yellow-700',
  inadimplente: 'bg-red-100 text-red-700',
  encerrado:    'bg-gray-100 text-gray-500',
}

const nivelAlertaStyle = {
  critico: { bg: 'bg-red-50', text: 'text-red-700', badge: 'CRÍTICO', badgeBg: 'bg-red-100 text-red-700' },
  atencao: { bg: 'bg-yellow-50', text: 'text-yellow-700', badge: 'ATENÇÃO', badgeBg: 'bg-yellow-100 text-yellow-700' },
  info: { bg: 'bg-blue-50', text: 'text-blue-700', badge: 'INFO', badgeBg: 'bg-blue-100 text-blue-700' }
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [showInsight, setShowInsight] = useState(true)
  const [data, setData] = useState(null)
  const [produtos, setProdutos] = useState([])

  useEffect(() => {
    dashboardService.getDashboard().then(setData).catch(console.error)
    produtosContratadosService.listar()
      .then(res => setProdutos(res.data ?? []))
      .catch(console.error)
  }, [])

  const ind = data?.indicadores
  const evolucao = data?.evolucao_clima ?? []
  const ranking = data?.ranking_setores ?? []
  const alertas = data?.alertas ?? []

  return (
    <div>
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-rp-azul">Dashboard geral</h1>
          <p className="text-sm text-rp-cinza-medio mt-0.5">Visão consolidada · dados em tempo real</p>
        </div>
        <Button variant="primary" onClick={() => navigate('/admin/relatorios')}>
          <Sparkles size={14} />
          Gerar relatório
        </Button>
      </div>

      {produtos.length > 0 && (
        <div className="bg-white rounded-xl shadow-card p-4 mb-5 flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-2 mr-2">
            <Package size={14} className="text-rp-azul" />
            <span className="text-xs font-bold text-rp-azul uppercase tracking-wide">Seus produtos</span>
          </div>
          {produtos.map(p => (
            <div key={p.id} className="flex items-center gap-2 bg-rp-cinza-claro/60 rounded-lg px-3 py-1.5">
              <span className="text-xs font-semibold text-rp-texto">{p.titulo}</span>
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${STATUS_PRODUTO_CLS[p.status] ?? 'bg-gray-100 text-gray-500'}`}>
                {p.status}
              </span>
              {p.tipo === 'recorrente_mensal' && p.proxima_cobranca_em && (
                <span className="text-[10px] text-rp-cinza-medio">próx. ciclo: {new Date(p.proxima_cobranca_em).toLocaleDateString('pt-BR')}</span>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-5">
        <StatCard
          icon={<Heart size={18} strokeWidth={1.8} />}
          label="Índice geral de clima"
          value={ind?.clima_geral ?? '—'}
          unit="/100"
        />
        <StatCard
          icon={<Users size={18} strokeWidth={1.8} />}
          label="Participação"
          value={ind?.participacao ?? '—'}
          unit="%"
        />
        <StatCard
          icon={<Shield size={18} strokeWidth={1.8} />}
          label="Risco psicossocial"
          value={ind?.risco_psicossocial ?? '—'}
        />
        <StatCard
          icon={<AlertTriangle size={18} strokeWidth={1.8} />}
          label="Setores em atenção"
          value={ind?.setores_atencao ?? '—'}
          unit={ind ? `/${ind.setores_total}` : ''}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-5">
        <div className="lg:col-span-3 bg-white rounded-xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h3 className="text-base font-bold text-rp-azul">Evolução do clima</h3>
              <p className="text-xs text-rp-cinza-medio">últimos 6 meses · escala 0–100</p>
            </div>
            <div className="flex gap-2">
              <span className="flex items-center gap-1 text-xs font-semibold text-rp-azul">
                <span className="w-3 h-0.5 bg-rp-azul inline-block rounded" /> CLIMA
              </span>
              <span className="flex items-center gap-1 text-xs font-semibold text-rp-laranja">
                <span className="w-3 h-0.5 bg-rp-laranja inline-block rounded" /> ENGAJAMENTO
              </span>
            </div>
          </div>
          <EvolutionChart data={evolucao} />
        </div>

        <div className="lg:col-span-2 bg-white rounded-xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-rp-azul">Ranking de setores</h3>
            <button
              onClick={() => navigate('/admin/riscos')}
              className="text-xs text-rp-azul font-semibold hover:underline"
            >
              ver todos
            </button>
          </div>
          <p className="text-xs text-rp-cinza-medio mb-3">por índice de clima</p>
          <SectorChart data={ranking} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-rp-azul">Alertas recentes</h3>
            <button className="text-xs text-rp-azul font-semibold hover:underline">histórico completo</button>
          </div>
          {alertas.length === 0 && (
            <p className="text-sm text-rp-cinza-medio text-center py-4">Nenhum alerta no momento.</p>
          )}
          <div className="space-y-2">
            {alertas.map((alerta) => {
              const style = nivelAlertaStyle[alerta.nivel] || nivelAlertaStyle.info
              const clickable = !!alerta.link
              return (
                <div
                  key={alerta.id}
                  onClick={clickable ? () => navigate(alerta.link) : undefined}
                  className={`flex items-center gap-3 px-4 py-3 rounded-xl ${style.bg} ${clickable ? 'cursor-pointer hover:opacity-90 transition-opacity' : ''}`}
                >
                  <AlertTriangle size={15} className={style.text} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-semibold ${style.text}`}>{alerta.titulo}</p>
                    <p className="text-xs text-rp-cinza-medio">{alerta.descricao} · {relativeTime(alerta.tempo)}</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0 ${style.badgeBg}`}>
                    {style.badge}
                  </span>
                  <ChevronRight size={14} className="text-rp-cinza-medio flex-shrink-0" />
                </div>
              )
            })}
          </div>
        </div>

        {showInsight && (
          <div className="rounded-xl p-5 relative" style={{ backgroundColor: '#002244' }}>
            <button onClick={() => setShowInsight(false)} className="absolute top-3 right-3 text-white/40 hover:text-white/80">
              <X size={14} />
            </button>
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-rp-laranja/20 flex items-center justify-center">
                <Sparkles size={14} className="text-rp-laranja" />
              </div>
              <span className="text-[10px] font-bold text-rp-laranja uppercase tracking-widest">
                Insight da consultoria
              </span>
            </div>
            <p className="text-sm text-white/90 leading-relaxed mb-4">
              Os dados de clima desta semana mostram tendência de melhora. Continue monitorando os setores em atenção e ative o plano de ação para riscos elevados.
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => navigate('/admin/riscos')}
                className="flex-1 bg-rp-laranja text-white text-xs font-semibold py-2.5 rounded-lg hover:bg-rp-laranja-claro transition-colors"
              >
                Ver mapa de riscos
              </button>
              <button
                onClick={() => setShowInsight(false)}
                className="px-3 py-2.5 text-white/60 text-xs font-medium rounded-lg hover:bg-white/10 transition-colors"
              >
                Descartar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
