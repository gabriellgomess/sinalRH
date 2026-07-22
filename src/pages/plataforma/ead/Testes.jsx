import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Plus, Trash2, Pencil, ClipboardCheck, Check } from 'lucide-react'
import { PageTitle } from '../../../components/ui/PageTitle'
import { Button } from '../../../components/ui/Button'
import { Input } from '../../../components/ui/Input'
import { Modal } from '../../../components/ui/Modal'
import { LoadingState } from '../../../components/ui/LoadingState'
import { EmptyState } from '../../../components/ui/EmptyState'
import { plataformaEadService } from '../../../services/plataformaService'

export default function Testes() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [curso, setCurso] = useState(null)
  const [testes, setTestes] = useState([])
  const [loading, setLoading] = useState(true)
  const [testeModal, setTesteModal] = useState(null)  // config do teste
  const [gerenciando, setGerenciando] = useState(null) // teste cujas perguntas edito

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const [c, t] = await Promise.all([
        plataformaEadService.buscarCurso(id),
        plataformaEadService.listarTestes(id),
      ])
      setCurso(c.data)
      setTestes(t.data ?? [])
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }, [id])

  useEffect(() => { carregar() }, [carregar])

  async function salvarTeste() {
    const t = testeModal
    if (!t.titulo?.trim()) return
    const payload = {
      titulo: t.titulo,
      descricao: t.descricao,
      modulo_id: t.modulo_id || null,
      nota_minima: Number(t.nota_minima) || 70,
      tentativas_max: t.tentativas_max === '' || t.tentativas_max == null ? null : Number(t.tentativas_max),
      embaralhar: !!t.embaralhar,
      obrigatorio_aprovacao: !!t.obrigatorio_aprovacao,
    }
    if (t.id) await plataformaEadService.atualizarTeste(id, t.id, payload)
    else await plataformaEadService.criarTeste(id, payload)
    setTesteModal(null); carregar()
  }

  async function excluirTeste(testeId) {
    if (!confirm('Remover este teste e suas perguntas?')) return
    await plataformaEadService.excluirTeste(id, testeId); carregar()
  }

  if (loading || !curso) return <LoadingState />

  if (gerenciando) {
    return <PerguntasEditor cursoId={id} teste={gerenciando} onBack={() => { setGerenciando(null); carregar() }} modulos={curso.modulos ?? []} />
  }

  return (
    <div>
      <button onClick={() => navigate(`/plataforma/ead/cursos/${id}`)} className="flex items-center gap-1.5 text-sm text-rp-cinza-medio hover:text-rp-azul mb-4">
        <ArrowLeft size={16} /> Voltar ao curso
      </button>

      <PageTitle
        title="Testes de aptidão"
        subtitle={curso.titulo}
        action={
          <Button variant="primary" onClick={() => setTesteModal({ titulo: '', descricao: '', nota_minima: 70, tentativas_max: '', embaralhar: false, obrigatorio_aprovacao: true, modulo_id: '' })}>
            <Plus size={14} /> Novo teste
          </Button>
        }
      />

      {testes.length === 0 ? (
        <EmptyState icon={<ClipboardCheck size={44} />} title="Nenhum teste" description="Crie testes para avaliar a aptidão dos colaboradores." />
      ) : (
        <div className="space-y-3">
          {testes.map((t) => (
            <div key={t.id} className="bg-white rounded-xl shadow-card p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-rp-azul-suave flex items-center justify-center text-rp-azul">
                <ClipboardCheck size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-rp-texto truncate">{t.titulo}</p>
                <p className="text-xs text-rp-cinza-medio">
                  {t.perguntas_count ?? 0} perguntas · nota mínima {t.nota_minima}% · {t.tentativas_max ? `${t.tentativas_max} tentativas` : 'tentativas ilimitadas'}
                </p>
              </div>
              <Button variant="outline" size="sm" onClick={() => setGerenciando(t)}>Perguntas</Button>
              <button onClick={() => setTesteModal({ ...t, tentativas_max: t.tentativas_max ?? '', modulo_id: t.modulo_id ?? '' })} className="p-2 rounded hover:bg-rp-cinza-claro text-rp-cinza-medio"><Pencil size={15} /></button>
              <button onClick={() => excluirTeste(t.id)} className="p-2 rounded hover:bg-red-50 text-rp-cinza-medio hover:text-rp-critico"><Trash2 size={15} /></button>
            </div>
          ))}
        </div>
      )}

      <Modal open={!!testeModal} onClose={() => setTesteModal(null)} title={testeModal?.id ? 'Editar teste' : 'Novo teste'} size="lg">
        {testeModal && (
          <div className="p-5 space-y-4">
            <Input label="Título" value={testeModal.titulo} onChange={(e) => setTesteModal({ ...testeModal, titulo: e.target.value })} autoFocus />
            <div>
              <label className="block text-sm font-medium text-rp-texto mb-1.5">Descrição (opcional)</label>
              <textarea rows={2} className="input-field" value={testeModal.descricao || ''} onChange={(e) => setTesteModal({ ...testeModal, descricao: e.target.value })} />
            </div>
            <div>
              <label className="block text-sm font-medium text-rp-texto mb-1.5">Vínculo</label>
              <select className="input-field appearance-none bg-white" value={testeModal.modulo_id || ''} onChange={(e) => setTesteModal({ ...testeModal, modulo_id: e.target.value })}>
                <option value="">Teste final do curso</option>
                {(curso.modulos ?? []).map((m) => <option key={m.id} value={m.id}>Módulo: {m.titulo}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Input label="Nota mínima (%)" type="number" value={testeModal.nota_minima} onChange={(e) => setTesteModal({ ...testeModal, nota_minima: e.target.value })} />
              <Input label="Máx. tentativas (vazio = ilimitado)" type="number" value={testeModal.tentativas_max} onChange={(e) => setTesteModal({ ...testeModal, tentativas_max: e.target.value })} />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={!!testeModal.embaralhar} onChange={(e) => setTesteModal({ ...testeModal, embaralhar: e.target.checked })} /> Embaralhar perguntas
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={!!testeModal.obrigatorio_aprovacao} onChange={(e) => setTesteModal({ ...testeModal, obrigatorio_aprovacao: e.target.checked })} /> Aprovação obrigatória para concluir o curso
            </label>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setTesteModal(null)}>Cancelar</Button>
              <Button variant="primary" onClick={salvarTeste}>Salvar</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function PerguntasEditor({ cursoId, teste, onBack }) {
  const [perguntas, setPerguntas] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null)

  const carregar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await plataformaEadService.buscarTeste(cursoId, teste.id)
      setPerguntas(res.data.perguntas ?? [])
    } catch (e) { console.error(e) } finally { setLoading(false) }
  }, [cursoId, teste.id])

  useEffect(() => { carregar() }, [carregar])

  function nova() {
    setModal({ enunciado: '', tipo: 'multipla_escolha', opcoes: ['', ''], resposta_correta: [], peso: 1 })
  }

  async function salvar() {
    const m = modal
    if (!m.enunciado?.trim()) return
    const isVF = m.tipo === 'verdadeiro_falso'
    const opcoes = isVF ? ['Verdadeiro', 'Falso'] : m.opcoes.filter((o) => o.trim() !== '')
    if (!isVF && opcoes.length < 2) { alert('Adicione ao menos 2 alternativas.'); return }
    if (!m.resposta_correta || m.resposta_correta.length === 0) { alert('Marque a resposta correta.'); return }
    const payload = { enunciado: m.enunciado, tipo: m.tipo, opcoes, resposta_correta: m.resposta_correta, peso: Number(m.peso) || 1 }
    if (m.id) await plataformaEadService.atualizarPergunta(cursoId, teste.id, m.id, payload)
    else await plataformaEadService.criarPergunta(cursoId, teste.id, payload)
    setModal(null); carregar()
  }

  async function excluir(pid) {
    if (!confirm('Remover esta pergunta?')) return
    await plataformaEadService.excluirPergunta(cursoId, teste.id, pid); carregar()
  }

  function toggleCorreta(idx) {
    setModal((m) => {
      const set = new Set(m.resposta_correta)
      if (m.tipo === 'verdadeiro_falso') return { ...m, resposta_correta: [idx] }
      if (set.has(idx)) set.delete(idx); else set.add(idx)
      return { ...m, resposta_correta: Array.from(set).sort((a, b) => a - b) }
    })
  }

  if (loading) return <LoadingState />

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-1.5 text-sm text-rp-cinza-medio hover:text-rp-azul mb-4">
        <ArrowLeft size={16} /> Voltar aos testes
      </button>
      <PageTitle title={teste.titulo} subtitle={`${perguntas.length} pergunta(s)`} action={<Button variant="primary" onClick={nova}><Plus size={14} /> Nova pergunta</Button>} />

      <div className="space-y-3">
        {perguntas.map((p, i) => (
          <div key={p.id} className="bg-white rounded-xl shadow-card p-4">
            <div className="flex items-start gap-3">
              <span className="text-xs font-bold text-rp-cinza-medio mt-0.5">{i + 1}.</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-rp-texto">{p.enunciado}</p>
                <ul className="mt-2 space-y-1">
                  {(p.opcoes ?? []).map((o, idx) => (
                    <li key={idx} className={`text-xs flex items-center gap-1.5 ${(p.resposta_correta ?? []).includes(idx) ? 'text-green-600 font-semibold' : 'text-rp-cinza-medio'}`}>
                      {(p.resposta_correta ?? []).includes(idx) ? <Check size={12} /> : <span className="w-3" />} {o}
                    </li>
                  ))}
                </ul>
              </div>
              <button onClick={() => setModal({ ...p, opcoes: p.opcoes ?? ['', ''], resposta_correta: p.resposta_correta ?? [] })} className="p-2 rounded hover:bg-rp-cinza-claro text-rp-cinza-medio"><Pencil size={14} /></button>
              <button onClick={() => excluir(p.id)} className="p-2 rounded hover:bg-red-50 text-rp-cinza-medio hover:text-rp-critico"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
        {perguntas.length === 0 && <div className="bg-white rounded-xl shadow-card p-8 text-center text-sm text-rp-cinza-medio">Nenhuma pergunta ainda.</div>}
      </div>

      <Modal open={!!modal} onClose={() => setModal(null)} title={modal?.id ? 'Editar pergunta' : 'Nova pergunta'} size="lg">
        {modal && (
          <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
            <div>
              <label className="block text-sm font-medium text-rp-texto mb-1.5">Enunciado</label>
              <textarea rows={2} className="input-field" value={modal.enunciado} onChange={(e) => setModal({ ...modal, enunciado: e.target.value })} autoFocus />
            </div>
            <div>
              <label className="block text-sm font-medium text-rp-texto mb-1.5">Tipo</label>
              <select className="input-field appearance-none bg-white" value={modal.tipo}
                onChange={(e) => {
                  const tipo = e.target.value
                  setModal((m) => ({ ...m, tipo, opcoes: tipo === 'verdadeiro_falso' ? ['Verdadeiro', 'Falso'] : (m.opcoes.length >= 2 ? m.opcoes : ['', '']), resposta_correta: [] }))
                }}>
                <option value="multipla_escolha">Múltipla escolha</option>
                <option value="verdadeiro_falso">Verdadeiro / Falso</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-rp-texto mb-1.5">Alternativas {modal.tipo === 'multipla_escolha' && <span className="text-rp-cinza-medio font-normal">(marque a(s) correta(s))</span>}</label>
              <div className="space-y-2">
                {modal.opcoes.map((o, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <button type="button" onClick={() => toggleCorreta(idx)} className={`w-5 h-5 rounded flex items-center justify-center border flex-shrink-0 ${modal.resposta_correta.includes(idx) ? 'bg-green-500 border-green-500 text-white' : 'border-rp-cinza-borda'}`}>
                      {modal.resposta_correta.includes(idx) && <Check size={12} />}
                    </button>
                    {modal.tipo === 'verdadeiro_falso' ? (
                      <span className="flex-1 text-sm">{o}</span>
                    ) : (
                      <>
                        <input className="input-field flex-1" value={o} onChange={(e) => setModal((m) => { const op = [...m.opcoes]; op[idx] = e.target.value; return { ...m, opcoes: op } })} placeholder={`Alternativa ${idx + 1}`} />
                        <button type="button" onClick={() => setModal((m) => ({ ...m, opcoes: m.opcoes.filter((_, i2) => i2 !== idx), resposta_correta: m.resposta_correta.filter((r) => r !== idx).map((r) => r > idx ? r - 1 : r) }))} className="text-rp-cinza-medio hover:text-rp-critico"><Trash2 size={14} /></button>
                      </>
                    )}
                  </div>
                ))}
              </div>
              {modal.tipo === 'multipla_escolha' && (
                <button type="button" onClick={() => setModal((m) => ({ ...m, opcoes: [...m.opcoes, ''] }))} className="mt-2 text-xs text-rp-azul font-medium flex items-center gap-1"><Plus size={12} /> Alternativa</button>
              )}
            </div>

            <Input label="Peso" type="number" value={modal.peso} onChange={(e) => setModal({ ...modal, peso: e.target.value })} />

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setModal(null)}>Cancelar</Button>
              <Button variant="primary" onClick={salvar}>Salvar pergunta</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}
