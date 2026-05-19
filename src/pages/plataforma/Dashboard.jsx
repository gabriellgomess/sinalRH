import { useState, useEffect } from 'react'
import { Building2, Users, ClipboardList, Heart, TrendingUp } from 'lucide-react'
import { plataformaDashboardService } from '../../services/plataformaService'
import { useAuth } from '../../contexts/AuthContext'

const planoColors = {
  enterprise: 'bg-purple-100 text-purple-700',
  pleno:      'bg-blue-100 text-blue-700',
  starter:    'bg-green-100 text-green-700',
  free:       'bg-gray-100 text-gray-500',
}

export default function PlataformaDashboard() {
  const { admin } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    plataformaDashboardService.get()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const ind = data?.indicadores

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-rp-azul">
          Olá, {admin?.nome?.split(' ')[0]} 👋
        </h1>
        <p className="text-sm text-rp-cinza-medio mt-0.5">
          Visão geral da plataforma Radar Pessoas
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { icon: Building2,    label: 'Empresas ativas',      value: ind?.total_empresas      ?? '—', color: 'text-rp-azul',    bg: 'bg-rp-azul-suave' },
          { icon: Users,        label: 'Colaboradores ativos', value: ind?.total_colaboradores ?? '—', color: 'text-green-600', bg: 'bg-green-50' },
          { icon: ClipboardList,label: 'Pesquisas ativas',     value: ind?.pesquisas_ativas    ?? '—', color: 'text-rp-laranja', bg: 'bg-orange-50' },
          { icon: Heart,        label: 'Check-ins hoje',       value: ind?.checkins_hoje       ?? '—', color: 'text-purple-600', bg: 'bg-purple-50' },
        ].map(({ icon: Icon, label, value, color, bg }) => (
          <div key={label} className="bg-white rounded-xl p-5 shadow-card">
            <div className={`w-10 h-10 rounded-xl ${bg} flex items-center justify-center mb-3`}>
              <Icon size={18} className={color} strokeWidth={1.8} />
            </div>
            <p className="text-2xl font-bold text-rp-azul">{value}</p>
            <p className="text-xs text-rp-cinza-medio mt-1">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 bg-white rounded-xl p-5 shadow-card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-rp-azul">Clientes recentes</h3>
          </div>
          {loading ? (
            <p className="text-sm text-rp-cinza-medio py-4 text-center">Carregando...</p>
          ) : (
            <div className="space-y-2">
              {(data?.empresas_recentes ?? []).map((e) => (
                <div key={e.id} className="flex items-center gap-3 px-4 py-3 rounded-xl border border-rp-cinza-borda">
                  <div
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                    style={{ backgroundColor: '#003366' }}
                  >
                    {e.nome_fantasia?.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-rp-texto">{e.nome_fantasia}</p>
                    <p className="text-xs text-rp-cinza-medio">{e.colaboradores_count ?? 0} colaboradores</p>
                  </div>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${planoColors[e.plano] ?? planoColors.free}`}>
                    {e.plano}
                  </span>
                </div>
              ))}
              {!loading && (data?.empresas_recentes ?? []).length === 0 && (
                <p className="text-sm text-rp-cinza-medio text-center py-4">Nenhuma empresa cadastrada ainda.</p>
              )}
            </div>
          )}
        </div>

        <div className="bg-white rounded-xl p-5 shadow-card">
          <h3 className="text-base font-bold text-rp-azul mb-4">Distribuição por plano</h3>
          {loading ? (
            <p className="text-sm text-rp-cinza-medio py-4 text-center">Carregando...</p>
          ) : (
            <div className="space-y-3">
              {Object.entries(data?.por_plano ?? {}).map(([plano, total]) => (
                <div key={plano} className="flex items-center justify-between py-2 border-b border-rp-cinza-borda last:border-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${planoColors[plano] ?? planoColors.free}`}>
                      {plano}
                    </span>
                  </div>
                  <span className="text-sm font-bold text-rp-azul">{total} empresa{total !== 1 ? 's' : ''}</span>
                </div>
              ))}
              {Object.keys(data?.por_plano ?? {}).length === 0 && (
                <p className="text-sm text-rp-cinza-medio text-center py-4">Sem dados.</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
