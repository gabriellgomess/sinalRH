import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, Eye, FileText, Youtube, Video, ClipboardCheck, Circle } from 'lucide-react'
import { PageTitle } from '../../../components/ui/PageTitle'
import { LoadingState } from '../../../components/ui/LoadingState'
import { eadAdminService } from '../../../services/adminService'
import { AulaViewer } from '../../../components/ead/AulaViewer'
import { TesteRunner } from '../../../components/ead/TesteRunner'

const tipoIcone = { video_upload: Video, video_youtube: Youtube, texto: FileText, documento: FileText }

export default function CursoVisualizar() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [dados, setDados] = useState(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState({ tipo: 'lista' })
  const [aula, setAula] = useState(null)
  const [teste, setTeste] = useState(null)

  const carregar = useCallback(() => {
    setLoading(true)
    eadAdminService.visualizarCurso(id).then(setDados).catch(() => {}).finally(() => setLoading(false))
  }, [id])

  useEffect(() => { carregar() }, [carregar])

  async function abrirAula(a) {
    const conteudo = await eadAdminService.buscarAula(a.id)
    setAula(conteudo); setView({ tipo: 'aula' }); window.scrollTo(0, 0)
  }
  async function abrirTeste(t) {
    const res = await eadAdminService.buscarTeste(t.id)
    setTeste(res); setView({ tipo: 'teste' }); window.scrollTo(0, 0)
  }

  if (loading || !dados) return <LoadingState />

  const banner = (
    <div className="mb-4 flex items-center gap-2 text-xs text-yellow-800 bg-yellow-50 border border-yellow-200 rounded-lg px-3 py-2">
      <Eye size={14} /> Modo visualização — seu progresso e notas não são registrados nos índices.
    </div>
  )

  if (view.tipo === 'aula' && aula) {
    return (
      <div className="max-w-2xl">
        <button onClick={() => setView({ tipo: 'lista' })} className="flex items-center gap-1.5 text-sm text-rp-cinza-medio mb-3"><ArrowLeft size={16} /> Voltar</button>
        {banner}
        <h2 className="text-lg font-bold text-rp-texto mb-3">{aula.titulo}</h2>
        <AulaViewer aula={aula} videoSrc={eadAdminService.videoUrl(aula.id)} verHref={(anexoId) => eadAdminService.anexoVerUrl(aula.id, anexoId)} anexoHref={(anexoId) => eadAdminService.anexoUrl(aula.id, anexoId)} />
      </div>
    )
  }

  if (view.tipo === 'teste' && teste) {
    return (
      <div className="max-w-2xl">
        <button onClick={() => setView({ tipo: 'lista' })} className="flex items-center gap-1.5 text-sm text-rp-cinza-medio mb-3"><ArrowLeft size={16} /> Voltar</button>
        {banner}
        <h2 className="text-lg font-bold text-rp-texto mb-3">{teste.teste.titulo}</h2>
        <TesteRunner
          teste={teste.teste}
          perguntas={teste.perguntas}
          modoVisualizacao
          onSubmit={(respostas) => eadAdminService.simularTeste(teste.teste.id, respostas)}
        />
      </div>
    )
  }

  const testesFinais = (dados.testes ?? []).filter((t) => !t.modulo_id)
  const testesPorModulo = (moduloId) => (dados.testes ?? []).filter((t) => t.modulo_id === moduloId)

  return (
    <div className="max-w-2xl">
      <button onClick={() => navigate('/admin/ead/cursos')} className="flex items-center gap-1.5 text-sm text-rp-cinza-medio mb-3"><ArrowLeft size={16} /> Treinamentos</button>
      <PageTitle title={dados.curso.titulo} subtitle={dados.curso.descricao} />
      {banner}

      <div className="space-y-4">
        {(dados.modulos ?? []).map((m) => (
          <div key={m.id}>
            <p className="text-xs font-bold text-rp-cinza-medio uppercase tracking-wide mb-2">{m.titulo}</p>
            <div className="bg-white rounded-xl shadow-card divide-y divide-rp-cinza-borda overflow-hidden">
              {m.aulas.map((a) => {
                const Icone = tipoIcone[a.tipo] || FileText
                return (
                  <button key={a.id} onClick={() => abrirAula(a)} className="flex items-center gap-3 px-4 py-3 w-full text-left hover:bg-rp-cinza-claro">
                    <Circle size={16} className="text-rp-cinza-borda flex-shrink-0" />
                    <Icone size={15} className="text-rp-azul flex-shrink-0" />
                    <span className="flex-1 text-sm text-rp-texto truncate">{a.titulo}</span>
                  </button>
                )
              })}
              {testesPorModulo(m.id).map((t) => (
                <button key={`t${t.id}`} onClick={() => abrirTeste(t)} className="flex items-center gap-3 px-4 py-3 w-full text-left hover:bg-rp-cinza-claro">
                  <ClipboardCheck size={16} className="text-rp-laranja flex-shrink-0" />
                  <span className="flex-1 text-sm text-rp-texto truncate">{t.titulo}</span>
                  <span className="text-[11px] text-rp-cinza-medio">{t.perguntas} perguntas</span>
                </button>
              ))}
            </div>
          </div>
        ))}

        {testesFinais.length > 0 && (
          <div>
            <p className="text-xs font-bold text-rp-cinza-medio uppercase tracking-wide mb-2">Avaliação final</p>
            <div className="bg-white rounded-xl shadow-card divide-y divide-rp-cinza-borda overflow-hidden">
              {testesFinais.map((t) => (
                <button key={`t${t.id}`} onClick={() => abrirTeste(t)} className="flex items-center gap-3 px-4 py-3 w-full text-left hover:bg-rp-cinza-claro">
                  <ClipboardCheck size={16} className="text-rp-laranja flex-shrink-0" />
                  <span className="flex-1 text-sm text-rp-texto truncate">{t.titulo}</span>
                  <span className="text-[11px] text-rp-cinza-medio">{t.perguntas} perguntas</span>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
