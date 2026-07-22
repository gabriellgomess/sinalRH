import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { GraduationCap, Plus, ChevronRight, Users, BookOpen } from 'lucide-react'
import { PageTitle } from '../../../components/ui/PageTitle'
import { Button } from '../../../components/ui/Button'
import { Badge } from '../../../components/ui/Badge'
import { EmptyState } from '../../../components/ui/EmptyState'
import { LoadingState } from '../../../components/ui/LoadingState'
import { Modal } from '../../../components/ui/Modal'
import { Input } from '../../../components/ui/Input'
import { plataformaEadService } from '../../../services/plataformaService'

const statusVariant = { rascunho: 'rascunho', publicado: 'ativa', arquivado: 'default' }
const statusLabel = { rascunho: 'Rascunho', publicado: 'Publicado', arquivado: 'Arquivado' }

export default function EadCursos() {
  const navigate = useNavigate()
  const [cursos, setCursos] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(false)
  const [titulo, setTitulo] = useState('')
  const [salvando, setSalvando] = useState(false)

  function carregar() {
    setLoading(true)
    plataformaEadService.listarCursos()
      .then((res) => setCursos(res.data ?? []))
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  useEffect(carregar, [])

  async function criar() {
    if (!titulo.trim()) return
    setSalvando(true)
    try {
      const res = await plataformaEadService.criarCurso({ titulo: titulo.trim() })
      setModal(false)
      setTitulo('')
      navigate(`/plataforma/ead/cursos/${res.data.id}`)
    } catch (e) {
      console.error(e)
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div>
      <PageTitle
        title="Cursos EAD"
        subtitle={`${cursos.length} curso${cursos.length !== 1 ? 's' : ''} criado${cursos.length !== 1 ? 's' : ''}`}
        action={
          <Button variant="primary" onClick={() => setModal(true)}>
            <Plus size={14} /> Novo curso
          </Button>
        }
      />

      {loading ? (
        <LoadingState />
      ) : cursos.length === 0 ? (
        <EmptyState
          icon={<GraduationCap size={48} />}
          title="Nenhum curso ainda"
          description="Monte seu primeiro curso e libere para as empresas que desejar."
          action={<Button variant="primary" onClick={() => setModal(true)}><Plus size={14} /> Novo curso</Button>}
        />
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {cursos.map((c) => (
            <div
              key={c.id}
              onClick={() => navigate(`/plataforma/ead/cursos/${c.id}`)}
              className="bg-white rounded-xl shadow-card p-5 cursor-pointer transition-all hover:shadow-card-hover hover:-translate-y-0.5"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-lg bg-rp-azul-suave flex items-center justify-center text-rp-azul">
                  <BookOpen size={20} />
                </div>
                <Badge label={statusLabel[c.status]} variant={statusVariant[c.status]} />
              </div>
              <h3 className="text-sm font-semibold text-rp-texto mb-1 line-clamp-2">{c.titulo}</h3>
              <div className="flex items-center gap-4 mt-3 text-xs text-rp-cinza-medio">
                <span className="flex items-center gap-1"><BookOpen size={12} /> {c.total_aulas ?? 0} aulas</span>
                <span className="flex items-center gap-1"><Users size={12} /> {c.empresas_count ?? 0} empresas</span>
              </div>
              <div className="flex items-center justify-end mt-3 text-rp-azul text-xs font-medium">
                Abrir <ChevronRight size={14} />
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal open={modal} onClose={() => setModal(false)} title="Novo curso">
        <div className="p-5 space-y-4">
          <Input
            label="Título do curso"
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ex.: Integração de novos colaboradores"
            autoFocus
          />
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setModal(false)}>Cancelar</Button>
            <Button variant="primary" loading={salvando} onClick={criar}>Criar e montar</Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
