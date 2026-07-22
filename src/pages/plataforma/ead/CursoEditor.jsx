import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, Plus, Trash2, Pencil, ChevronDown, ChevronRight,
  Video, FileText, Youtube, Send, Copy, Archive, Building2, ClipboardCheck, GripVertical,
  Upload, Paperclip, Image as ImageIcon, X, Download
} from 'lucide-react'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { Input } from '../../../components/ui/Input'
import { Modal } from '../../../components/ui/Modal'
import { LoadingState } from '../../../components/ui/LoadingState'
import { RichTextEditor } from '../../../components/ui/RichTextEditor'
import { plataformaEadService } from '../../../services/plataformaService'

const statusVariant = { rascunho: 'rascunho', publicado: 'ativa', arquivado: 'default' }
const statusLabel = { rascunho: 'Rascunho', publicado: 'Publicado', arquivado: 'Arquivado' }
const tipoIcone = { video_upload: Video, video_youtube: Youtube, texto: FileText, documento: FileText }

export default function CursoEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [curso, setCurso] = useState(null)
  const [loading, setLoading] = useState(true)
  const [expandido, setExpandido] = useState({})

  // Modais
  const [moduloModal, setModuloModal] = useState(null)   // {id?, titulo, descricao}
  const [aulaModal, setAulaModal] = useState(null)       // {moduloId, id?, titulo, tipo, conteudo, video_youtube_id}
  const [dadosModal, setDadosModal] = useState(false)

  const carregar = useCallback(() => {
    setLoading(true)
    plataformaEadService.buscarCurso(id)
      .then((res) => {
        setCurso(res.data)
        const exp = {}
        ;(res.data.modulos ?? []).forEach((m) => { exp[m.id] = true })
        setExpandido(exp)
      })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [id])

  useEffect(() => { carregar() }, [carregar])

  if (loading || !curso) return <LoadingState />

  const totalAulas = (curso.modulos ?? []).reduce((acc, m) => acc + (m.aulas?.length ?? 0), 0)

  // ── Ações de curso ──────────────────────────────────────────────────────
  async function publicar() {
    try { await plataformaEadService.publicarCurso(id); carregar() }
    catch (e) { alert(e.response?.data?.message || 'Não foi possível publicar.') }
  }
  async function arquivar() {
    if (!confirm('Arquivar este curso? Ele deixará de aparecer para as empresas.')) return
    await plataformaEadService.arquivarCurso(id); carregar()
  }
  async function duplicar() {
    const res = await plataformaEadService.duplicarCurso(id)
    navigate(`/plataforma/ead/cursos/${res.data.id}`)
  }
  async function excluir() {
    const nome = curso.titulo
    if (!confirm(`Remover PERMANENTEMENTE o curso "${nome}"?\n\nIsto apaga em cascata: módulos, aulas, vídeos e anexos, testes, liberações para empresas e todas as matrículas/notas dos colaboradores. Esta ação não pode ser desfeita.`)) return
    if (!confirm('Confirmar remoção definitiva? Não há como recuperar.')) return
    try {
      await plataformaEadService.excluirCurso(id)
      navigate('/plataforma/ead/cursos')
    } catch (e) {
      alert(e.response?.data?.message || 'Não foi possível remover o curso.')
    }
  }

  // ── Módulos ───────────────────────────────────────────────────────────
  async function salvarModulo() {
    const { id: mid, titulo, descricao } = moduloModal
    if (!titulo?.trim()) return
    if (mid) await plataformaEadService.atualizarModulo(id, mid, { titulo, descricao })
    else await plataformaEadService.criarModulo(id, { titulo, descricao })
    setModuloModal(null); carregar()
  }
  async function excluirModulo(mid) {
    if (!confirm('Remover este módulo e todas as suas aulas?')) return
    await plataformaEadService.excluirModulo(id, mid); carregar()
  }

  // ── Aulas ─────────────────────────────────────────────────────────────
  async function salvarAula() {
    const a = aulaModal
    if (!a.titulo?.trim()) return
    const payload = {
      titulo: a.titulo,
      tipo: a.tipo,
      conteudo: a.tipo === 'texto' ? a.conteudo : null,
      video_youtube_id: a.tipo === 'video_youtube' ? a.video_youtube_id : null,
    }
    if (a.id) await plataformaEadService.atualizarAula(id, a.moduloId, a.id, payload)
    else await plataformaEadService.criarAula(id, a.moduloId, payload)
    setAulaModal(null); carregar()
  }
  async function excluirAula(moduloId, aulaId) {
    if (!confirm('Remover esta aula?')) return
    await plataformaEadService.excluirAula(id, moduloId, aulaId); carregar()
  }

  return (
    <div>
      <button onClick={() => navigate('/plataforma/ead/cursos')} className="flex items-center gap-1.5 text-sm text-rp-cinza-medio hover:text-rp-azul mb-4">
        <ArrowLeft size={16} /> Voltar aos cursos
      </button>

      {/* Cabeçalho do curso */}
      <div className="bg-white rounded-xl shadow-card p-6 mb-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <div className="flex items-center gap-3 mb-1">
              <h1 className="text-xl font-bold text-rp-azul truncate">{curso.titulo}</h1>
              <Badge label={statusLabel[curso.status]} variant={statusVariant[curso.status]} />
            </div>
            <p className="text-sm text-rp-cinza-medio">{curso.descricao || 'Sem descrição.'}</p>
            <div className="flex items-center gap-4 mt-3 text-xs text-rp-cinza-medio">
              <span>{curso.modulos?.length ?? 0} módulos</span>
              <span>{totalAulas} aulas</span>
              {curso.obrigatorio && <Badge label="Obrigatório" variant="info" />}
            </div>
          </div>
          <button onClick={() => setDadosModal(true)} className="p-2 rounded-lg hover:bg-rp-cinza-claro text-rp-cinza-medio flex-shrink-0">
            <Pencil size={16} />
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mt-5 pt-4 border-t border-rp-cinza-borda">
          <Button variant="outline" size="sm" onClick={() => navigate(`/plataforma/ead/cursos/${id}/testes`)}>
            <ClipboardCheck size={14} /> Testes
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate(`/plataforma/ead/cursos/${id}/empresas`)}>
            <Building2 size={14} /> Liberar para empresas
          </Button>
          <Button variant="outline" size="sm" onClick={duplicar}><Copy size={14} /> Duplicar</Button>
          {curso.status !== 'arquivado' && (
            <Button variant="outline" size="sm" onClick={arquivar}><Archive size={14} /> Arquivar</Button>
          )}
          <Button variant="danger" size="sm" onClick={excluir}><Trash2 size={14} /> Excluir</Button>
          {curso.status !== 'publicado' && (
            <Button variant="primary" size="sm" onClick={publicar}><Send size={14} /> Publicar</Button>
          )}
        </div>
      </div>

      {/* Módulos e aulas */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-bold text-rp-texto uppercase tracking-wide">Conteúdo</h2>
        <Button variant="ghost" size="sm" onClick={() => setModuloModal({ titulo: '', descricao: '' })}>
          <Plus size={14} /> Módulo
        </Button>
      </div>

      {(curso.modulos ?? []).length === 0 && (
        <div className="bg-white rounded-xl shadow-card p-8 text-center text-sm text-rp-cinza-medio">
          Nenhum módulo ainda. Comece adicionando um módulo.
        </div>
      )}

      <div className="space-y-3">
        {(curso.modulos ?? []).map((m) => {
          const aberto = expandido[m.id]
          return (
            <div key={m.id} className="bg-white rounded-xl shadow-card overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-rp-cinza-borda">
                <button onClick={() => setExpandido((s) => ({ ...s, [m.id]: !s[m.id] }))} className="text-rp-cinza-medio">
                  {aberto ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                </button>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-rp-texto truncate">{m.titulo}</p>
                  {m.descricao && <p className="text-xs text-rp-cinza-medio truncate">{m.descricao}</p>}
                </div>
                <span className="text-xs text-rp-cinza-medio">{m.aulas?.length ?? 0} aulas</span>
                <button onClick={() => setModuloModal({ id: m.id, titulo: m.titulo, descricao: m.descricao || '' })} className="p-1.5 rounded hover:bg-rp-cinza-claro text-rp-cinza-medio"><Pencil size={14} /></button>
                <button onClick={() => excluirModulo(m.id)} className="p-1.5 rounded hover:bg-red-50 text-rp-cinza-medio hover:text-rp-critico"><Trash2 size={14} /></button>
              </div>

              {aberto && (
                <div className="divide-y divide-rp-cinza-borda">
                  {(m.aulas ?? []).map((a) => {
                    const Icone = tipoIcone[a.tipo] || FileText
                    return (
                      <div key={a.id} className="flex items-center gap-3 px-4 py-2.5 hover:bg-rp-cinza-claro/50">
                        <GripVertical size={14} className="text-rp-cinza-borda" />
                        <Icone size={16} className="text-rp-azul flex-shrink-0" />
                        <span className="flex-1 text-sm text-rp-texto truncate">{a.titulo}</span>
                        <button onClick={() => setAulaModal({ moduloId: m.id, id: a.id, titulo: a.titulo, tipo: a.tipo, conteudo: a.conteudo || '', video_youtube_id: a.video_youtube_id || '' })} className="p-1.5 rounded hover:bg-white text-rp-cinza-medio"><Pencil size={13} /></button>
                        <button onClick={() => excluirAula(m.id, a.id)} className="p-1.5 rounded hover:bg-red-50 text-rp-cinza-medio hover:text-rp-critico"><Trash2 size={13} /></button>
                      </div>
                    )
                  })}
                  <button
                    onClick={() => setAulaModal({ moduloId: m.id, titulo: '', tipo: 'texto', conteudo: '', video_youtube_id: '' })}
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-rp-azul hover:bg-rp-azul-suave/40 w-full"
                  >
                    <Plus size={14} /> Adicionar aula
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Modal dados do curso */}
      <Modal open={dadosModal} onClose={() => setDadosModal(false)} title="Dados do curso" size="lg">
        <DadosCursoForm curso={curso} onSaved={() => { setDadosModal(false); carregar() }} />
      </Modal>

      {/* Modal módulo */}
      <Modal open={!!moduloModal} onClose={() => setModuloModal(null)} title={moduloModal?.id ? 'Editar módulo' : 'Novo módulo'}>
        {moduloModal && (
          <div className="p-5 space-y-4">
            <Input label="Título" value={moduloModal.titulo} onChange={(e) => setModuloModal({ ...moduloModal, titulo: e.target.value })} autoFocus />
            <Input label="Descrição (opcional)" value={moduloModal.descricao} onChange={(e) => setModuloModal({ ...moduloModal, descricao: e.target.value })} />
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setModuloModal(null)}>Cancelar</Button>
              <Button variant="primary" onClick={salvarModulo}>Salvar</Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Modal aula */}
      <Modal open={!!aulaModal} onClose={() => setAulaModal(null)} title={aulaModal?.id ? 'Editar aula' : 'Nova aula'} size="lg">
        {aulaModal && (
          <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
            <Input label="Título da aula" value={aulaModal.titulo} onChange={(e) => setAulaModal({ ...aulaModal, titulo: e.target.value })} autoFocus />
            <div>
              <label className="block text-sm font-medium text-rp-texto mb-1.5">Tipo de conteúdo</label>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { v: 'texto', label: 'Texto', icon: FileText },
                  { v: 'video_youtube', label: 'Vídeo (YouTube)', icon: Youtube },
                  { v: 'video_upload', label: 'Vídeo (upload)', icon: Video },
                  { v: 'documento', label: 'Documento', icon: Paperclip },
                ].map(({ v, label, icon: Ic }) => (
                  <button
                    key={v}
                    onClick={() => setAulaModal({ ...aulaModal, tipo: v })}
                    className={`flex items-center gap-2 px-3 py-2.5 rounded-lg border text-sm transition-all ${aulaModal.tipo === v ? 'border-rp-azul bg-rp-azul-suave text-rp-azul font-semibold' : 'border-rp-cinza-borda text-rp-cinza-medio hover:border-rp-azul/40'}`}
                  >
                    <Ic size={16} /> {label}
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs text-rp-cinza-medio">Upload de vídeo e documentos ficam disponíveis na aula após salvar.</p>
            </div>

            {aulaModal.tipo === 'texto' && (
              <div>
                <label className="block text-sm font-medium text-rp-texto mb-1.5">Conteúdo</label>
                <RichTextEditor value={aulaModal.conteudo} onChange={(html) => setAulaModal((s) => ({ ...s, conteudo: html }))} />
              </div>
            )}

            {aulaModal.tipo === 'video_youtube' && (
              <Input
                label="Link ou ID do vídeo no YouTube"
                value={aulaModal.video_youtube_id}
                onChange={(e) => setAulaModal({ ...aulaModal, video_youtube_id: e.target.value })}
                placeholder="https://youtube.com/watch?v=..."
                hint="Cole a URL completa; o sistema extrai o ID automaticamente."
              />
            )}

            {aulaModal.id ? (
              <AulaMidia cursoId={id} moduloId={aulaModal.moduloId} aula={aulaModal} onVideoOk={carregar} />
            ) : (
              <p className="text-xs text-rp-cinza-medio bg-rp-cinza-claro rounded-lg px-3 py-2">
                Salve a aula primeiro para enviar vídeo ou anexos.
              </p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setAulaModal(null)}>Cancelar</Button>
              <Button variant="primary" onClick={salvarAula}>Salvar aula</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}

function DadosCursoForm({ curso, onSaved }) {
  const [form, setForm] = useState({
    titulo: curso.titulo,
    descricao: curso.descricao || '',
    obrigatorio: !!curso.obrigatorio,
    carga_horaria_min: curso.carga_horaria_min || '',
    prazo_dias: curso.prazo_dias || '',
  })
  const [salvando, setSalvando] = useState(false)

  async function salvar() {
    setSalvando(true)
    try {
      await plataformaEadService.atualizarCurso(curso.id, {
        ...form,
        carga_horaria_min: form.carga_horaria_min === '' ? null : Number(form.carga_horaria_min),
        prazo_dias: form.prazo_dias === '' ? null : Number(form.prazo_dias),
      })
      onSaved()
    } catch (e) { console.error(e) } finally { setSalvando(false) }
  }

  return (
    <div className="p-5 space-y-4">
      <Input label="Título" value={form.titulo} onChange={(e) => setForm({ ...form, titulo: e.target.value })} />
      <div>
        <label className="block text-sm font-medium text-rp-texto mb-1.5">Descrição</label>
        <textarea
          value={form.descricao}
          onChange={(e) => setForm({ ...form, descricao: e.target.value })}
          rows={3}
          className="input-field"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Carga horária (min)" type="number" value={form.carga_horaria_min} onChange={(e) => setForm({ ...form, carga_horaria_min: e.target.value })} />
        <Input label="Prazo padrão (dias)" type="number" value={form.prazo_dias} onChange={(e) => setForm({ ...form, prazo_dias: e.target.value })} />
      </div>
      <label className="flex items-center gap-2 text-sm text-rp-texto cursor-pointer">
        <input type="checkbox" checked={form.obrigatorio} onChange={(e) => setForm({ ...form, obrigatorio: e.target.checked })} />
        Curso obrigatório
      </label>
      <div className="flex justify-end gap-2">
        <Button variant="primary" loading={salvando} onClick={salvar}>Salvar</Button>
      </div>
    </div>
  )
}


function AulaMidia({ cursoId, moduloId, aula, onVideoOk }) {
  const [anexos, setAnexos] = useState([])
  const [prog, setProg] = useState(null)
  const [erro, setErro] = useState('')
  const videoRef = useRef(null)
  const anexoRef = useRef(null)

  const carregarAnexos = useCallback(() => {
    plataformaEadService.listarAnexos(cursoId, moduloId, aula.id)
      .then((res) => setAnexos(res.data ?? []))
      .catch(() => {})
  }, [cursoId, moduloId, aula.id])

  useEffect(() => { carregarAnexos() }, [carregarAnexos])

  async function enviarVideo(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setErro(''); setProg(0)
    try {
      await plataformaEadService.enviarVideo(cursoId, moduloId, aula.id, file, setProg)
      setProg(100)
      onVideoOk?.()
      setTimeout(() => setProg(null), 800)
    } catch (err) {
      setErro(err.response?.data?.message || Object.values(err.response?.data?.errors || {})[0]?.[0] || 'Falha no upload.')
      setProg(null)
    } finally {
      if (videoRef.current) videoRef.current.value = ''
    }
  }

  async function enviarAnexo(e) {
    const file = e.target.files?.[0]
    if (!file) return
    setErro('')
    try {
      await plataformaEadService.enviarAnexo(cursoId, moduloId, aula.id, file)
      carregarAnexos()
    } catch (err) {
      setErro(err.response?.data?.message || 'Falha ao enviar anexo.')
    } finally {
      if (anexoRef.current) anexoRef.current.value = ''
    }
  }

  async function removerAnexo(anexoId) {
    if (!confirm('Remover este anexo?')) return
    await plataformaEadService.removerAnexo(cursoId, moduloId, aula.id, anexoId)
    carregarAnexos()
  }

  return (
    <div className="space-y-4 border-t border-rp-cinza-borda pt-4">
      {aula.tipo === 'video_upload' && (
        <div>
          <label className="block text-sm font-medium text-rp-texto mb-1.5">Arquivo de vídeo (MP4 recomendado, até 500 MB)</label>
          {aula.video_storage && prog === null && (
            <p className="text-xs text-green-600 mb-2 flex items-center gap-1"><Video size={13} /> Vídeo enviado. Enviar outro substitui o atual.</p>
          )}
          <input ref={videoRef} type="file" accept="video/mp4,video/webm,video/quicktime" onChange={enviarVideo} className="text-sm" />
          {prog !== null && (
            <div className="mt-2">
              <div className="w-full bg-rp-cinza-borda rounded-full h-2 overflow-hidden">
                <div className="h-full bg-rp-azul rounded-full transition-all" style={{ width: `${prog}%` }} />
              </div>
              <span className="text-xs text-rp-cinza-medio">{prog}% enviado</span>
            </div>
          )}
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-sm font-medium text-rp-texto">Anexos (imagens e documentos)</label>
          <button onClick={() => anexoRef.current?.click()} className="text-xs text-rp-azul font-medium flex items-center gap-1">
            <Upload size={13} /> Adicionar
          </button>
          <input ref={anexoRef} type="file" onChange={enviarAnexo} className="hidden"
            accept=".pdf,.png,.jpg,.jpeg,.gif,.webp,.doc,.docx,.xls,.xlsx,.ppt,.pptx" />
        </div>
        {anexos.length === 0 ? (
          <p className="text-xs text-rp-cinza-medio">Nenhum anexo.</p>
        ) : (
          <ul className="space-y-1">
            {anexos.map((a) => (
              <li key={a.id} className="flex items-center gap-2 text-sm bg-rp-cinza-claro rounded-lg px-3 py-2">
                {a.categoria === 'imagem' ? <ImageIcon size={14} className="text-rp-azul" /> : <Paperclip size={14} className="text-rp-azul" />}
                <span className="flex-1 truncate">{a.nome_original}</span>
                <button onClick={() => removerAnexo(a.id)} className="text-rp-cinza-medio hover:text-rp-critico"><X size={14} /></button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {erro && <p className="text-xs text-rp-critico">{erro}</p>}
    </div>
  )
}
