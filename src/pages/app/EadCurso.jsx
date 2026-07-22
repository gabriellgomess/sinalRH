import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, CheckCircle2, Circle, FileText, Youtube, Video, ClipboardCheck, Award, Lock, Check
} from 'lucide-react'
import { eadService } from '../../services/appService'
import { AulaViewer } from '../../components/ead/AulaViewer'
import { TesteRunner } from '../../components/ead/TesteRunner'

const tipoIcone = { video_upload: Video, video_youtube: Youtube, texto: FileText, documento: FileText }

export default function EadCurso() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [dados, setDados] = useState(null)
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState({ tipo: 'lista' })
  const [aula, setAula] = useState(null)
  const [teste, setTeste] = useState(null)
  const [concluindo, setConcluindo] = useState(false)

  const carregar = useCallback(() => {
    setLoading(true)
    eadService.buscarCurso(id).then(setDados).catch(() => {}).finally(() => setLoading(false))
  }, [id])

  useEffect(() => { carregar() }, [carregar])

  async function abrirAula(a) {
    const conteudo = await eadService.buscarAula(a.id)
    setAula({ ...conteudo, concluida: a.concluida })
    setView({ tipo: 'aula', aulaId: a.id })
    window.scrollTo(0, 0)
  }

  async function concluirAula() {
    setConcluindo(true)
    try {
      await eadService.concluirAula(aula.id)
      await carregar()
      setView({ tipo: 'lista' })
    } catch (e) { console.error(e) } finally { setConcluindo(false) }
  }

  async function abrirTeste(t) {
    const res = await eadService.buscarTeste(t.id)
    setTeste(res)
    setView({ tipo: 'teste', testeId: t.id })
    window.scrollTo(0, 0)
  }

  if (loading || !dados) return <div className="p-4 text-sm text-rp-cinza-medio">Carregando...</div>

  // ── Sub-view: aula ──
  if (view.tipo === 'aula' && aula) {
    return (
      <div className="p-4">
        <button onClick={() => setView({ tipo: 'lista' })} className="flex items-center gap-1.5 text-sm text-rp-cinza-medio mb-3">
          <ArrowLeft size={16} /> Voltar
        </button>
        <h2 className="text-base font-bold text-rp-texto mb-3">{aula.titulo}</h2>
        <AulaViewer aula={aula} videoSrc={eadService.videoUrl(aula.id)} anexoHref={(anexoId) => eadService.anexoUrl(aula.id, anexoId)} />
        <button
          onClick={concluirAula}
          disabled={concluindo}
          className="mt-6 w-full inline-flex items-center justify-center gap-2 bg-rp-laranja text-white font-semibold rounded-lg py-3 text-sm disabled:opacity-50"
        >
          <CheckCircle2 size={18} /> {aula.concluida ? 'Concluída — marcar novamente' : (concluindo ? 'Salvando...' : 'Marcar como concluída')}
        </button>
      </div>
    )
  }

  // ── Sub-view: teste ──
  if (view.tipo === 'teste' && teste) {
    return (
      <div className="p-4">
        <button onClick={() => { setView({ tipo: 'lista' }); carregar() }} className="flex items-center gap-1.5 text-sm text-rp-cinza-medio mb-3">
          <ArrowLeft size={16} /> Voltar ao curso
        </button>
        <h2 className="text-base font-bold text-rp-texto mb-1">{teste.teste.titulo}</h2>
        {teste.teste.descricao && <p className="text-sm text-rp-cinza-medio mb-4">{teste.teste.descricao}</p>}
        <TesteRunner
          teste={teste.teste}
          perguntas={teste.perguntas}
          onSubmit={(respostas) => eadService.responderTeste(teste.teste.id, respostas)}
        />
      </div>
    )
  }

  // ── Trilha do curso ──
  const testesFinais = (dados.testes ?? []).filter((t) => !t.modulo_id)
  const testesPorModulo = (moduloId) => (dados.testes ?? []).filter((t) => t.modulo_id === moduloId)

  return (
    <div className="p-4">
      <button onClick={() => navigate('/app/ead')} className="flex items-center gap-1.5 text-sm text-rp-cinza-medio mb-3">
        <ArrowLeft size={16} /> Meus cursos
      </button>

      <h1 className="text-lg font-bold text-rp-azul">{dados.curso.titulo}</h1>
      {dados.curso.descricao && <p className="text-sm text-rp-cinza-medio mt-0.5">{dados.curso.descricao}</p>}

      <div className="mt-3 bg-white rounded-xl shadow-card p-3">
        <div className="flex items-center justify-between text-xs text-rp-cinza-medio mb-1.5">
          <span>Progresso</span>
          <span className="font-semibold text-rp-texto">{dados.matricula.progresso_pct}%</span>
        </div>
        <div className="w-full bg-rp-cinza-borda rounded-full h-2 overflow-hidden">
          <div className="h-full bg-rp-azul rounded-full transition-all" style={{ width: `${dados.matricula.progresso_pct}%` }} />
        </div>
        {dados.matricula.status === 'concluido' && (
          <p className="mt-2 text-xs text-green-600 font-medium flex items-center gap-1"><Award size={13} /> Curso concluído{dados.matricula.nota_final != null ? ` · nota ${dados.matricula.nota_final}%` : ''}</p>
        )}
      </div>

      <div className="mt-4 space-y-4">
        {(dados.modulos ?? []).map((m) => (
          <div key={m.id}>
            <p className="text-xs font-bold text-rp-cinza-medio uppercase tracking-wide mb-2">{m.titulo}</p>
            <div className="bg-white rounded-xl shadow-card divide-y divide-rp-cinza-borda overflow-hidden">
              {m.aulas.map((a) => {
                const Icone = tipoIcone[a.tipo] || FileText
                return (
                  <button key={a.id} onClick={() => abrirAula(a)} className="flex items-center gap-3 px-4 py-3 w-full text-left active:bg-rp-cinza-claro">
                    {a.concluida ? <CheckCircle2 size={18} className="text-green-500 flex-shrink-0" /> : <Circle size={18} className="text-rp-cinza-borda flex-shrink-0" />}
                    <Icone size={15} className="text-rp-azul flex-shrink-0" />
                    <span className="flex-1 text-sm text-rp-texto truncate">{a.titulo}</span>
                  </button>
                )
              })}
              {testesPorModulo(m.id).map((t) => (
                <TesteLinha key={`t${t.id}`} teste={t} onOpen={() => abrirTeste(t)} />
              ))}
            </div>
          </div>
        ))}

        {testesFinais.length > 0 && (
          <div>
            <p className="text-xs font-bold text-rp-cinza-medio uppercase tracking-wide mb-2">Avaliação final</p>
            <div className="bg-white rounded-xl shadow-card divide-y divide-rp-cinza-borda overflow-hidden">
              {testesFinais.map((t) => <TesteLinha key={`t${t.id}`} teste={t} onOpen={() => abrirTeste(t)} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function TesteLinha({ teste, onOpen }) {
  const bloqueado = teste.tentativas_max && teste.tentativas_feitas >= teste.tentativas_max && !teste.aprovado
  return (
    <button onClick={bloqueado ? undefined : onOpen} disabled={bloqueado} className="flex items-center gap-3 px-4 py-3 w-full text-left active:bg-rp-cinza-claro disabled:opacity-60">
      {teste.aprovado ? <Award size={18} className="text-green-500 flex-shrink-0" /> : bloqueado ? <Lock size={16} className="text-rp-cinza-medio flex-shrink-0" /> : <ClipboardCheck size={18} className="text-rp-laranja flex-shrink-0" />}
      <div className="flex-1 min-w-0">
        <span className="text-sm text-rp-texto block truncate">{teste.titulo}</span>
        <span className="text-[11px] text-rp-cinza-medio">
          {teste.perguntas} perguntas · nota mínima {teste.nota_minima}%
          {teste.melhor_nota != null && ` · sua melhor: ${teste.melhor_nota}%`}
        </span>
      </div>
      {teste.aprovado && <Check size={16} className="text-green-500" />}
    </button>
  )
}
