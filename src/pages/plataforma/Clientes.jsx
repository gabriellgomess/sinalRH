import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Plus, ChevronRight, Users } from 'lucide-react'
import { PageTitle } from '../../components/ui/PageTitle'
import { Button } from '../../components/ui/Button'
import { plataformaEmpresaService } from '../../services/plataformaService'
import { formatDate } from '../../utils/formatters'

const statusStyle = {
  ativo:     'bg-green-100 text-green-700',
  suspenso:  'bg-yellow-100 text-yellow-700',
  cancelado: 'bg-gray-100 text-gray-500',
}

const planoStyle = {
  enterprise: 'bg-purple-100 text-purple-700',
  pleno:      'bg-blue-100 text-blue-700',
  starter:    'bg-green-100 text-green-700',
  free:       'bg-gray-100 text-gray-500',
}

export default function Clientes() {
  const navigate = useNavigate()
  const [empresas, setEmpresas] = useState([])
  const [total, setTotal] = useState(0)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    plataformaEmpresaService.listar({ search: search || undefined })
      .then((data) => {
        setEmpresas(data.data ?? [])
        setTotal(data.total ?? 0)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [search])

  return (
    <div>
      <PageTitle
        title="Clientes"
        subtitle={`${total} empresa${total !== 1 ? 's' : ''} cadastrada${total !== 1 ? 's' : ''}`}
        action={
          <Button variant="primary" onClick={() => navigate('/plataforma/clientes/novo')}>
            <Plus size={14} /> Novo cliente
          </Button>
        }
      />

      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-rp-cinza-borda">
          <div className="relative flex-1 max-w-xs">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-rp-cinza-medio" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar empresa..."
              className="w-full pl-9 pr-3 py-2 text-sm bg-rp-cinza-claro border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-rp-azul focus:bg-white"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center">
            <p className="text-sm text-rp-cinza-medio">Carregando clientes...</p>
          </div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-rp-cinza-borda bg-rp-cinza-claro/50">
                <th className="text-left px-5 py-3 text-xs font-bold text-rp-cinza-medio uppercase tracking-wide">Empresa</th>
                <th className="text-left px-3 py-3 text-xs font-bold text-rp-cinza-medio uppercase tracking-wide hidden md:table-cell">Plano</th>
                <th className="text-left px-3 py-3 text-xs font-bold text-rp-cinza-medio uppercase tracking-wide hidden lg:table-cell">Admin</th>
                <th className="text-left px-3 py-3 text-xs font-bold text-rp-cinza-medio uppercase tracking-wide hidden lg:table-cell">Empregados</th>
                <th className="text-left px-3 py-3 text-xs font-bold text-rp-cinza-medio uppercase tracking-wide">Status</th>
                <th className="text-left px-3 py-3 text-xs font-bold text-rp-cinza-medio uppercase tracking-wide hidden md:table-cell">Criado em</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {empresas.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-12 text-center text-sm text-rp-cinza-medio">
                    Nenhuma empresa encontrada.
                  </td>
                </tr>
              )}
              {empresas.map((e) => {
                const adminUser = e.users?.[0]
                return (
                  <tr
                    key={e.id}
                    onClick={() => navigate(`/plataforma/clientes/${e.id}`)}
                    className="border-b border-rp-cinza-borda last:border-0 hover:bg-rp-cinza-claro/50 transition-colors cursor-pointer"
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-9 h-9 rounded-xl flex items-center justify-center text-white text-xs font-bold flex-shrink-0"
                          style={{ backgroundColor: '#003366' }}
                        >
                          {e.nome_fantasia?.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-rp-texto">{e.nome_fantasia}</p>
                          <p className="text-xs text-rp-cinza-medio">{e.setores_count ?? 0} setor{e.setores_count !== 1 ? 'es' : ''}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-3 hidden md:table-cell">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${planoStyle[e.plano] ?? planoStyle.free}`}>
                        {e.plano}
                      </span>
                    </td>
                    <td className="px-3 py-3 hidden lg:table-cell">
                      <p className="text-sm text-rp-texto">{adminUser?.nome ?? '—'}</p>
                      <p className="text-xs text-rp-cinza-medio">{adminUser?.email ?? ''}</p>
                    </td>
                    <td className="px-3 py-3 hidden lg:table-cell">
                      <div className="flex items-center gap-1.5">
                        <Users size={12} className="text-rp-cinza-medio" />
                        <span className="text-sm text-rp-texto">{e.colaboradores_count ?? 0}</span>
                      </div>
                    </td>
                    <td className="px-3 py-3">
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full capitalize ${statusStyle[e.status] ?? statusStyle.ativo}`}>
                        {e.status}
                      </span>
                    </td>
                    <td className="px-3 py-3 hidden md:table-cell">
                      <span className="text-sm text-rp-cinza-medio">{formatDate(e.created_at)}</span>
                    </td>
                    <td className="px-3 py-3">
                      <ChevronRight size={15} className="text-rp-cinza-medio" />
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        <div className="px-5 py-3 border-t border-rp-cinza-borda">
          <p className="text-xs text-rp-cinza-medio">
            Mostrando {empresas.length} de {total} clientes
          </p>
        </div>
      </div>
    </div>
  )
}
