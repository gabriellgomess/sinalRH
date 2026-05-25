import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Plus, BarChart2, FileText, Link2, CheckCircle, XCircle, Trash2, Copy } from 'lucide-react'
import { PageTitle } from '../../components/ui/PageTitle'
import { Button } from '../../components/ui/Button'
import { Badge } from '../../components/ui/Badge'
import { nr1AdminService } from '../../services/nr1Service'
import { formatDate } from '../../utils/formatters'

const tabs = [
  { key: 'todas', label: 'Todas' },
  { key: 'ativa', label: 'Ativas' },
  { key: 'encerrada', label: 'Encerradas' },
  { key: 'rascunho', label: 'Rascunhos' },
]

export default function Nr1Admin() {
  const navigate = useNavigate()
  const [avaliacoes, setAvaliacoes] = useState([])
  const [activeTab, setActiveTab] = useState('todas')
  const [loading, setLoading] = useState(true)
  const [copiado, setCopiado] = useState(null)

  useEffect(() => {
    nr1AdminService.listar()
      .then((res) => setAvaliacoes(res.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [])

  const filtered = activeTab === 'todas' ? avaliacoes : avaliacoes.filter((a) => a.status === activeTab)

  const counts = {
    todas: avaliacoes.length,
    ativa: avaliacoes.filter((a) => a.status === 'ativa').length,
    encerrada: avaliacoes.filter((a) => a.status === 'encerrada').length,
    rascunho: avaliacoes.filter((a) => a.status === 'rascunho').length,
  }

  function linkPublico(codigo) {
    return `${window.location.origin}/avaliacao/nr1/${codigo}`
  }

  async function copiarLink(codigo) {
    await navigator.clipboard.writeText(linkPublico(codigo))
    setCopiado(codigo)
    setTimeout(() => setCopiado(null), 2000)
  }

  async function handlePublicar(id) {
    try {
      const res = await nr1AdminService.publicar(id)
      setAvaliacoes((prev) => prev.map((a) => (a.id === id ? res.data : a)))
    } catch (e) {
      console.error(e)
    }
  }

  async function handleEncerrar(id) {
    try {
      const res = await nr1AdminService.encerrar(id)
      setAvaliacoes((prev) => prev.map((a) => (a.id === id ? res.data : a)))
    } catch (e) {
      console.error(e)
    }
  }

  async function handleExcluir(id) {
    if (!confirm('Excluir esta avaliação? Esta ação não pode ser desfeita.')) return
    try {
      await nr1AdminService.excluir(id)
      setAvaliacoes((prev) => prev.filter((a) => a.id !== id))
    } catch (e) {
      console.error(e)
    }
  }

  async function handleDuplicar(id) {
    if (!confirm('Criar uma nova versão desta avaliação? Será gerada uma cópia em rascunho com versão incrementada.')) return
    try {
      const res = await nr1AdminService.duplicar(id)
      setAvaliacoes((prev) => [{ ...res.data, respondentes_count: 0 }, ...prev])
      navigate(`/admin/nr1`)
    } catch (e) {
      alert(e.response?.data?.message || 'Erro ao criar nova versão.')
    }
  }

  return (
    <div>
      <PageTitle
        title="NR-1 / PGR — Avaliação Psicossocial"
        subtitle="Gerencie as avaliações de riscos psicossociais da sua empresa (Portaria MTE 1.419/2024)"
        action={
          <Button variant="primary" onClick={() => navigate('/admin/nr1/nova')}>
            <Plus size={14} /> Nova avaliação
          </Button>
        }
      />

      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="flex items-center px-5 py-4 border-b border-rp-cinza-borda gap-1">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab.key
                  ? 'bg-rp-azul text-white'
                  : 'text-rp-cinza-medio hover:text-rp-texto hover:bg-rp-cinza-claro'
              }`}
            >
              {tab.label}
              <span className={`ml-1.5 text-xs ${activeTab === tab.key ? 'text-white/70' : 'text-rp-cinza-medio'}`}>
                ({counts[tab.key]})
              </span>
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-12 text-center text-sm text-rp-cinza-medio">Carregando avaliações...</div>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="border-b border-rp-cinza-borda">
                <th className="text-left px-5 py-3 text-xs font-bold text-rp-cinza-medio uppercase tracking-wide">Avaliação</th>
                <th className="text-left px-3 py-3 text-xs font-bold text-rp-cinza-medio uppercase tracking-wide">Status</th>
                <th className="text-left px-3 py-3 text-xs font-bold text-rp-cinza-medio uppercase tracking-wide hidden md:table-cell">Respondentes</th>
                <th className="text-left px-3 py-3 text-xs font-bold text-rp-cinza-medio uppercase tracking-wide hidden lg:table-cell">Data</th>
                <th className="text-right px-5 py-3 text-xs font-bold text-rp-cinza-medio uppercase tracking-wide">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-5 py-12 text-center text-sm text-rp-cinza-medio">
                    Nenhuma avaliação encontrada.
                  </td>
                </tr>
              )}
              {filtered.map((a) => {
                const isExpired = a.status === 'ativa' && a.is_expirada
                return (
                  <tr key={a.id} className="border-b border-rp-cinza-borda last:border-0 hover:bg-rp-cinza-claro/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center flex-shrink-0 mt-0.5">
                          <FileText size={14} className="text-rp-azul" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-rp-texto">{a.titulo}</p>
                          <p className="text-xs text-rp-cinza-medio mt-0.5 flex items-center gap-2">
                            <span>Código: <span className="font-mono font-semibold">{a.codigo}</span></span>
                            <span className="inline-block px-1.5 py-0.5 bg-rp-azul-suave text-rp-azul rounded text-[10px] font-bold">
                              v{a.versao ?? '1.0'}
                            </span>
                            {a.versao_origem_id && (
                              <span className="text-[10px] text-rp-cinza-medio">
                                · revisão de #{a.versao_origem_id}
                              </span>
                            )}
                          </p>
                          {a.expira_em && (
                            <p className="text-xs mt-1 flex items-center gap-1.5">
                              {isExpired ? (
                                <span className="text-red-600 font-semibold flex items-center gap-1">
                                  <XCircle size={12} className="inline text-red-500 flex-shrink-0" /> Expirou em {formatDate(a.expira_em)}
                                </span>
                              ) : (
                                <span className="text-rp-cinza-medio flex items-center gap-1">
                                  <CheckCircle size={12} className="inline text-green-500 flex-shrink-0" /> Expira em: <span className="font-semibold text-rp-texto">{formatDate(a.expira_em)}</span>
                                </span>
                              )}
                            </p>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-3 py-4">
                      <Badge label={isExpired ? 'EXPIRADA' : a.status.toUpperCase()} variant={isExpired ? 'critico' : a.status} />
                    </td>
                    <td className="px-3 py-4 hidden md:table-cell">
                      <span className="text-sm font-medium text-rp-texto">{a.respondentes_count ?? 0}</span>
                    </td>
                  <td className="px-3 py-4 hidden lg:table-cell">
                    <span className="text-sm text-rp-cinza-medio">
                      {a.aplicada_em ? formatDate(a.aplicada_em) : '—'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <div className="flex items-center justify-end gap-1.5">
                      {a.status === 'ativa' && (
                        <button
                          onClick={() => copiarLink(a.codigo)}
                          title="Copiar link público"
                          className="p-1.5 rounded-lg hover:bg-green-50 text-rp-cinza-medio hover:text-green-600 transition-colors"
                        >
                          {copiado === a.codigo ? <CheckCircle size={15} className="text-green-600" /> : <Link2 size={15} />}
                        </button>
                      )}
                      {(a.status === 'ativa' || a.status === 'encerrada') && (
                        <button
                          onClick={() => navigate(`/admin/nr1/${a.id}/resultados`)}
                          title="Ver resultados"
                          className="p-1.5 rounded-lg hover:bg-rp-azul-suave text-rp-cinza-medio hover:text-rp-azul transition-colors"
                        >
                          <BarChart2 size={15} />
                        </button>
                      )}
                      {a.status === 'rascunho' && (
                        <button
                          onClick={() => handlePublicar(a.id)}
                          title="Publicar avaliação"
                          className="px-2.5 py-1 rounded-lg bg-green-50 text-green-700 text-xs font-semibold hover:bg-green-100 transition-colors"
                        >
                          Publicar
                        </button>
                      )}
                      {a.status === 'ativa' && (
                        <button
                          onClick={() => handleEncerrar(a.id)}
                          title="Encerrar avaliação"
                          className="p-1.5 rounded-lg hover:bg-red-50 text-rp-cinza-medio hover:text-red-500 transition-colors"
                        >
                          <XCircle size={15} />
                        </button>
                      )}
                      {(a.status === 'encerrada' || a.status === 'ativa') && (
                        <button
                          onClick={() => handleDuplicar(a.id)}
                          title="Criar nova versão (reavaliação)"
                          className="p-1.5 rounded-lg hover:bg-rp-laranja/10 text-rp-cinza-medio hover:text-rp-laranja transition-colors"
                        >
                          <Copy size={15} />
                        </button>
                      )}
                      {a.status === 'rascunho' && (
                        <button
                          onClick={() => handleExcluir(a.id)}
                          title="Excluir"
                          className="p-1.5 rounded-lg hover:bg-red-50 text-rp-cinza-medio hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        )}

        <div className="px-5 py-3 border-t border-rp-cinza-borda">
          <p className="text-xs text-rp-cinza-medio">{filtered.length} avaliação(ões) listada(s)</p>
        </div>
      </div>
    </div>
  )
}
