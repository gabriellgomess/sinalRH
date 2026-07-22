import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { GraduationCap, BookOpen, CheckCircle2, PlayCircle } from 'lucide-react'
import { eadService } from '../../services/appService'

const statusInfo = {
  nao_iniciado: { label: 'Não iniciado', cls: 'text-rp-cinza-medio' },
  em_andamento: { label: 'Em andamento', cls: 'text-rp-azul' },
  concluido:    { label: 'Concluído', cls: 'text-green-600' },
}

export default function Ead() {
  const navigate = useNavigate()
  const [cursos, setCursos] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    eadService.listarCursos().then(setCursos).catch(() => setCursos([])).finally(() => setLoading(false))
  }, [])

  return (
    <div className="p-4">
      <div className="flex items-center gap-2 mb-4">
        <GraduationCap className="text-rp-azul" size={22} />
        <h1 className="text-lg font-bold text-rp-azul">Meus cursos</h1>
      </div>

      {loading ? (
        <p className="text-sm text-rp-cinza-medio">Carregando...</p>
      ) : cursos.length === 0 ? (
        <div className="text-center py-16 text-rp-cinza-medio">
          <BookOpen size={40} className="mx-auto mb-3 opacity-40" />
          <p className="text-sm">Nenhum curso disponível no momento.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {cursos.map((c) => {
            const st = statusInfo[c.status] || statusInfo.nao_iniciado
            return (
              <button
                key={c.id}
                onClick={() => navigate(`/app/ead/${c.id}`)}
                className="w-full text-left bg-white rounded-xl shadow-card p-4 active:scale-[0.99] transition-transform"
              >
                <div className="flex items-start gap-3">
                  <div className="w-11 h-11 rounded-lg bg-rp-azul-suave flex items-center justify-center text-rp-azul flex-shrink-0">
                    {c.status === 'concluido' ? <CheckCircle2 size={22} /> : <PlayCircle size={22} />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-rp-texto truncate">{c.titulo}</h3>
                      {c.obrigatorio && <span className="text-[9px] font-bold text-rp-laranja bg-rp-laranja/10 px-1.5 py-0.5 rounded uppercase">Obrigatório</span>}
                    </div>
                    <p className="text-xs text-rp-cinza-medio mt-0.5">{c.total_aulas} aulas · <span className={st.cls}>{st.label}</span></p>
                    <div className="mt-2 w-full bg-rp-cinza-borda rounded-full h-1.5 overflow-hidden">
                      <div className="h-full bg-rp-azul rounded-full transition-all" style={{ width: `${c.progresso_pct}%` }} />
                    </div>
                    {c.prazo && <p className="text-[11px] text-rp-cinza-medio mt-1">Prazo: {c.prazo}</p>}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
