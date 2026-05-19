import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bell, ChevronRight, Calendar, CheckCircle } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'
import { homeService } from '../../services/appService'
import { formatDateLong } from '../../utils/formatters'

const moodEmojis = [
  { emoji: '😔', value: 1 },
  { emoji: '😕', value: 2 },
  { emoji: '😐', value: 3 },
  { emoji: '🙂', value: 4 },
  { emoji: '😊', value: 5 }
]

export default function Home() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [homeData, setHomeData] = useState(null)
  const now = new Date()

  useEffect(() => {
    homeService.getHome().then(setHomeData).catch(console.error)
  }, [])

  const pesquisaAtiva = homeData?.pesquisas_ativas?.[0]
  const ultimoComunicado = homeData?.comunicados?.[0]
  const checkinFeito = homeData?.checkin_feito
  const streak = homeData?.colaborador?.streak_checkins ?? user?.checkins_streak ?? 0

  return (
    <div className="min-h-screen">
      <div className="px-5 pt-5 pb-4" style={{ background: 'linear-gradient(135deg, #003366 0%, #002244 100%)' }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-white/70 text-xs font-medium capitalize">
              {formatDateLong(now.toISOString())}
            </p>
            <h1 className="text-white text-2xl font-bold mt-0.5">
              Olá, {user?.nome?.split(' ')[0]} 👋
            </h1>
            <p className="text-white/60 text-xs mt-1">
              Um espaço seguro para você dividir como está se sentindo no trabalho.
            </p>
          </div>
          <div className="w-11 h-11 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-base flex-shrink-0">
            {user?.iniciais || '?'}
          </div>
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {checkinFeito ? (
          <div className="bg-white rounded-xl p-4 shadow-card">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center flex-shrink-0">
                <CheckCircle size={20} className="text-green-600" />
              </div>
              <div>
                <p className="text-sm font-semibold text-rp-texto">Check-in desta semana realizado!</p>
                <p className="text-xs text-rp-cinza-medio mt-0.5">Continue na próxima semana.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-xl p-4 shadow-card">
            <div className="flex items-center gap-1.5 mb-3">
              <span className="text-[10px] font-bold text-rp-laranja uppercase tracking-widest">Check-in semanal</span>
            </div>
            <p className="text-sm font-semibold text-rp-texto mb-3">
              Como você está se sentindo no trabalho esta semana?
            </p>
            <div className="flex items-center justify-between mb-3">
              {moodEmojis.map((m) => (
                <button
                  key={m.value}
                  onClick={() => navigate('/app/checkin')}
                  className="flex flex-col items-center gap-0.5 active:scale-90 transition-transform"
                >
                  <span className="text-2xl">{m.emoji}</span>
                </button>
              ))}
            </div>
            <div className="flex justify-between text-[10px] text-rp-cinza-medio px-1 mb-3">
              <span>nada bem</span>
              <span>muito bem</span>
            </div>
            <button
              onClick={() => navigate('/app/checkin')}
              className="w-full bg-rp-laranja text-white font-semibold rounded-lg py-3 text-sm hover:bg-rp-laranja-claro active:scale-95 transition-all"
            >
              Responder check-in
            </button>
          </div>
        )}

        {ultimoComunicado && (
          <div
            className="bg-white rounded-xl p-4 shadow-card cursor-pointer"
            onClick={() => navigate('/app/comunicados')}
          >
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-rp-azul-suave flex items-center justify-center flex-shrink-0">
                <Bell size={16} className="text-rp-azul" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-bold text-rp-cinza-medio uppercase tracking-widest mb-0.5">
                  Comunicado · {ultimoComunicado.tipo}
                </p>
                <p className="text-sm font-semibold text-rp-texto leading-tight">{ultimoComunicado.titulo}</p>
              </div>
              <ChevronRight size={16} className="text-rp-cinza-medio flex-shrink-0 mt-1" />
            </div>
          </div>
        )}

        {pesquisaAtiva && (
          <div className="bg-white rounded-xl p-4 shadow-card">
            <div className="flex items-start justify-between mb-2">
              <div>
                <p className="text-[10px] font-bold text-rp-laranja uppercase tracking-widest mb-1">
                  Pesquisa disponível
                </p>
                <p className="text-sm font-semibold text-rp-texto">{pesquisaAtiva.titulo}</p>
                <p className="text-xs text-rp-cinza-medio mt-0.5">
                  {pesquisaAtiva.perguntas_count} perguntas
                  {pesquisaAtiva.prazo && ` · até ${new Date(pesquisaAtiva.prazo).toLocaleDateString('pt-BR', { day: '2-digit', month: 'numeric' })}`}
                </p>
              </div>
            </div>
            <button
              onClick={() => navigate(`/app/pesquisas/${pesquisaAtiva.id}`)}
              className="flex items-center gap-1 text-sm font-semibold text-rp-azul hover:text-rp-laranja transition-colors"
            >
              Responder <ChevronRight size={14} />
            </button>
          </div>
        )}

        <div className="bg-rp-azul-suave rounded-xl p-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-rp-azul flex items-center justify-center flex-shrink-0">
              <Calendar size={15} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-semibold text-rp-azul">
                {streak}ª semana seguida de check-in
              </p>
              <p className="text-xs text-rp-azul/70">Continue contribuindo com sua empresa!</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
