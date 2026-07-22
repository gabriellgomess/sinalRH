import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Search, Check, Building2, Save } from 'lucide-react'
import { PageTitle } from '../../../components/ui/PageTitle'
import { Button } from '../../../components/ui/Button'
import { LoadingState } from '../../../components/ui/LoadingState'
import { EmptyState } from '../../../components/ui/EmptyState'
import { plataformaEadService } from '../../../services/plataformaService'

export default function CursoEmpresas() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [curso, setCurso] = useState(null)
  const [empresas, setEmpresas] = useState([])
  const [selecionadas, setSelecionadas] = useState({})
  const [loading, setLoading] = useState(true)
  const [salvando, setSalvando] = useState(false)
  const [busca, setBusca] = useState('')

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const [c, emp] = await Promise.all([
        plataformaEadService.buscarCurso(id),
        plataformaEadService.listarEmpresas(id),
      ])
      setCurso(c.data)
      const lista = emp.data ?? []
      setEmpresas(lista)
      const sel = {}
      lista.forEach((e) => { if (e.liberado) sel[e.empresa_id] = true })
      setSelecionadas(sel)
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }, [id])

  useEffect(() => { carregar() }, [carregar])

  function toggle(empresaId) {
    setSelecionadas((s) => ({ ...s, [empresaId]: !s[empresaId] }))
  }

  async function salvar() {
    setSalvando(true)
    try {
      // Empresas marcadas -> liberar; desmarcadas que estavam liberadas -> remover.
      const marcar = empresas.filter((e) => selecionadas[e.empresa_id]).map((e) => ({ empresa_id: e.empresa_id }))
      const desmarcar = empresas.filter((e) => e.liberado && !selecionadas[e.empresa_id])

      if (marcar.length) await plataformaEadService.liberarEmpresas(id, marcar)
      for (const e of desmarcar) {
        await plataformaEadService.removerLiberacao(id, e.empresa_id)
      }
      await carregar()
      alert('Liberações atualizadas.')
    } catch (e) { console.error(e); alert('Erro ao salvar liberações.') }
    finally { setSalvando(false) }
  }

  if (loading || !curso) return <LoadingState />

  const filtradas = empresas.filter((e) => e.nome.toLowerCase().includes(busca.toLowerCase()))
  const totalSel = Object.values(selecionadas).filter(Boolean).length

  return (
    <div>
      <button onClick={() => navigate(`/plataforma/ead/cursos/${id}`)} className="flex items-center gap-1.5 text-sm text-rp-cinza-medio hover:text-rp-azul mb-4">
        <ArrowLeft size={16} /> Voltar ao curso
      </button>

      <PageTitle
        title="Liberar para empresas"
        subtitle={`${curso.titulo} · ${totalSel} empresa${totalSel !== 1 ? 's' : ''} selecionada${totalSel !== 1 ? 's' : ''}`}
        action={<Button variant="primary" loading={salvando} onClick={salvar}><Save size={14} /> Salvar liberações</Button>}
      />

      {curso.status !== 'publicado' && (
        <div className="mb-4 px-4 py-3 rounded-lg bg-yellow-50 border border-yellow-200 text-sm text-yellow-800">
          Este curso está em <strong>{curso.status}</strong>. Publique-o para que as empresas liberadas passem a vê-lo.
        </div>
      )}

      {empresas.length === 0 ? (
        <EmptyState
          icon={<Building2 size={44} />}
          title="Nenhuma empresa elegível"
          description="Apenas empresas com o produto EAD ativo aparecem aqui. Libere o produto EAD no cadastro do cliente."
        />
      ) : (
        <div className="bg-white rounded-xl shadow-card overflow-hidden">
          <div className="flex items-center gap-3 px-5 py-4 border-b border-rp-cinza-borda">
            <div className="relative flex-1 max-w-xs">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-rp-cinza-medio" />
              <input
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                placeholder="Buscar empresa..."
                className="w-full pl-9 pr-3 py-2 text-sm bg-rp-cinza-claro border border-transparent rounded-lg focus:outline-none focus:ring-2 focus:ring-rp-azul focus:bg-white"
              />
            </div>
          </div>
          <ul className="divide-y divide-rp-cinza-borda">
            {filtradas.map((e) => {
              const on = !!selecionadas[e.empresa_id]
              return (
                <li key={e.empresa_id}>
                  <button onClick={() => toggle(e.empresa_id)} className="flex items-center gap-3 px-5 py-3 w-full hover:bg-rp-cinza-claro/50 text-left">
                    <span className={`w-5 h-5 rounded flex items-center justify-center border transition-colors ${on ? 'bg-rp-azul border-rp-azul text-white' : 'border-rp-cinza-borda'}`}>
                      {on && <Check size={13} />}
                    </span>
                    <span className="flex-1 text-sm text-rp-texto">{e.nome}</span>
                    {e.liberado && <span className="text-xs text-green-600 font-medium">Liberado</span>}
                  </button>
                </li>
              )
            })}
          </ul>
        </div>
      )}
    </div>
  )
}
