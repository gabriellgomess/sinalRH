import { useState, useEffect } from 'react'
import { Bell, Plus, Pencil, Trash2, Send, Megaphone } from 'lucide-react'
import { PageTitle } from '../../components/ui/PageTitle'
import { Button } from '../../components/ui/Button'
import { Input } from '../../components/ui/Input'
import { Modal } from '../../components/ui/Modal'
import { Badge } from '../../components/ui/Badge'
import { EmptyState } from '../../components/ui/EmptyState'
import { LoadingState } from '../../components/ui/LoadingState'
import { comunicadoAdminService, setorService } from '../../services/adminService'

const tipoInfo = {
  info:    { label: 'Informativo', variant: 'info' },
  alerta:  { label: 'Alerta', variant: 'atencao' },
  urgente: { label: 'Urgente', variant: 'critico' },
}

export default function Comunicados() {
  const [lista, setLista] = useState([])
  const [setores, setSetores] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)
  const [salvando, setSalvando] = useState(false)

  function carregar() {
    setLoading(true)
    comunicadoAdminService.listar()
      .then((res) => setLista(res.data ?? res ?? []))
      .catch(() => setLista([]))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    carregar()
    setorService.listar().then((res) => setSetores(res.data ?? res ?? [])).catch(() => {})
  }, [])

  function novo() {
    setModal({ titulo: '', corpo: '', tipo: 'info', setor_id: '' })
  }

  async function salvar() {
    const m = modal
    if (!m.titulo.trim() || !m.corpo.trim()) return
    setSalvando(true)
    try {
      const payload = { titulo: m.titulo, corpo: m.corpo, tipo: m.tipo, setor_id: m.setor_id || null }
      if (m.id) await comunicadoAdminService.atualizar(m.id, payload)
      else await comunicadoAdminService.criar(payload)
      setModal(null)
      carregar()
    } catch (e) { console.error(e) } finally { setSalvando(false) }
  }

  async function publicar(c) {
    await comunicadoAdminService.publicar(c.id)
    carregar()
  }

  async function remover(c) {
    if (!confirm('Remover este comunicado?')) return
    await comunicadoAdminService.remover(c.id)
    carregar()
  }

  return (
    <div>
      <PageTitle
        title="Comunicados"
        subtitle="Avisos e mensagens para os colaboradores"
        action={<Button variant="primary" onClick={novo}><Plus size={14} /> Novo comunicado</Button>}
      />

      {loading ? (
        <LoadingState />
      ) : lista.length === 0 ? (
        <EmptyState
          icon={<Megaphone size={44} />}
          title="Nenhum comunicado"
          description="Crie um comunicado para avisar seus colaboradores. Ele aparece no app depois de publicado."
          action={<Button variant="primary" onClick={novo}><Plus size={14} /> Novo comunicado</Button>}
        />
      ) : (
        <div className="space-y-3">
          {lista.map((c) => {
            const ti = tipoInfo[c.tipo] || tipoInfo.info
            const setorNome = c.setor_id ? (setores.find((s) => s.id === c.setor_id)?.nome || 'Setor') : 'Todos os setores'
            return (
              <div key={c.id} className="bg-white rounded-xl shadow-card p-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-rp-azul-suave flex items-center justify-center text-rp-azul flex-shrink-0">
                    <Bell size={18} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-sm font-semibold text-rp-texto">{c.titulo}</h3>
                      <Badge label={ti.label} variant={ti.variant} />
                      {c.publicado
                        ? <Badge label="Publicado" variant="ativa" />
                        : <Badge label="Rascunho" variant="rascunho" />}
                    </div>
                    <p className="text-sm text-rp-cinza-medio mt-1 line-clamp-2">{c.corpo}</p>
                    <p className="text-[11px] text-rp-cinza-medio mt-1.5">{setorNome}</p>
                  </div>
                  <div className="flex items-center gap-1 flex-shrink-0">
                    {!c.publicado && (
                      <button onClick={() => publicar(c)} title="Publicar" className="p-2 rounded hover:bg-green-50 text-green-600"><Send size={15} /></button>
                    )}
                    <button onClick={() => setModal({ id: c.id, titulo: c.titulo, corpo: c.corpo, tipo: c.tipo, setor_id: c.setor_id || '' })} className="p-2 rounded hover:bg-rp-cinza-claro text-rp-cinza-medio"><Pencil size={15} /></button>
                    <button onClick={() => remover(c)} className="p-2 rounded hover:bg-red-50 text-rp-cinza-medio hover:text-rp-critico"><Trash2 size={15} /></button>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.id ? 'Editar comunicado' : 'Novo comunicado'} size="lg">
        {modal && (
          <div className="p-5 space-y-4">
            <Input label="Título" value={modal.titulo} onChange={(e) => setModal({ ...modal, titulo: e.target.value })} autoFocus />
            <div>
              <label className="block text-sm font-medium text-rp-texto mb-1.5">Mensagem</label>
              <textarea rows={5} className="input-field" value={modal.corpo} onChange={(e) => setModal({ ...modal, corpo: e.target.value })} placeholder="Escreva o comunicado..." />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-rp-texto mb-1.5">Tipo</label>
                <select className="input-field appearance-none bg-white" value={modal.tipo} onChange={(e) => setModal({ ...modal, tipo: e.target.value })}>
                  <option value="info">Informativo</option>
                  <option value="alerta">Alerta</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-rp-texto mb-1.5">Destinatário</label>
                <select className="input-field appearance-none bg-white" value={modal.setor_id} onChange={(e) => setModal({ ...modal, setor_id: e.target.value })}>
                  <option value="">Todos os setores</option>
                  {setores.map((s) => <option key={s.id} value={s.id}>{s.nome}</option>)}
                </select>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setModal(null)}>Cancelar</Button>
              <Button variant="primary" loading={salvando} onClick={salvar}>{modal.id ? 'Salvar' : 'Criar rascunho'}</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
