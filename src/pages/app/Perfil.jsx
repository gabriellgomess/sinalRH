import { useNavigate } from 'react-router-dom'
import { LogOut, CheckCircle, ClipboardList, Calendar, ChevronRight } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

export default function Perfil() {
  const { user, logoutColaborador } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logoutColaborador()
    navigate('/login')
  }

  const stats = [
    { icon: CheckCircle, label: 'Check-ins realizados', value: `${(user?.checkins_streak || 4) * 3} semanas`, color: 'bg-green-50 text-green-600' },
    { icon: ClipboardList, label: 'Pesquisas concluídas', value: `${user?.pesquisas_concluidas || 7} pesquisas`, color: 'bg-blue-50 text-blue-600' },
    { icon: Calendar, label: 'Sequência atual', value: `${user?.checkins_streak || 4} semanas`, color: 'bg-orange-50 text-orange-600' }
  ]

  return (
    <div className="min-h-screen bg-rp-cinza-claro">
      <div className="bg-white px-5 pt-6 pb-6 border-b border-rp-cinza-borda">
        <div className="flex flex-col items-center text-center">
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-3"
            style={{ backgroundColor: '#003366' }}
          >
            {user?.iniciais || 'AS'}
          </div>
          <h2 className="text-xl font-bold text-rp-texto">{user?.nome}</h2>
          <p className="text-sm text-rp-cinza-medio mt-0.5">{user?.cargo}</p>
          <p className="text-xs text-rp-cinza-medio">{user?.setor} · {user?.empresa}</p>
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        <div className="grid grid-cols-3 gap-2">
          {stats.map(({ icon: Icon, label, value, color }) => (
            <div key={label} className="bg-white rounded-xl p-3 shadow-card text-center">
              <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center mx-auto mb-2`}>
                <Icon size={16} />
              </div>
              <p className="text-sm font-bold text-rp-texto">{value.split(' ')[0]}</p>
              <p className="text-[10px] text-rp-cinza-medio leading-tight mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <div className="bg-white rounded-xl shadow-card overflow-hidden">
          {[
            { label: 'Notificações', desc: 'Gerencie seus alertas' },
            { label: 'Privacidade', desc: 'Configurações de dados' },
            { label: 'Sobre o Sinal RH', desc: 'Versão 1.0.0' }
          ].map(({ label, desc }) => (
            <button key={label} className="w-full flex items-center justify-between px-4 py-4 border-b border-rp-cinza-borda last:border-0 hover:bg-rp-cinza-claro transition-colors">
              <div className="text-left">
                <p className="text-sm font-medium text-rp-texto">{label}</p>
                <p className="text-xs text-rp-cinza-medio">{desc}</p>
              </div>
              <ChevronRight size={16} className="text-rp-cinza-medio" />
            </button>
          ))}
        </div>

        <div className="bg-rp-azul-suave rounded-xl px-4 py-3 text-center">
          <p className="text-xs text-rp-azul font-medium">
            Uma solução Sara Linhar Consultoria
          </p>
          <p className="text-[10px] text-rp-azul/60 mt-0.5">contato@saralinhar.com.br</p>
        </div>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-red-100 text-red-600 bg-red-50 font-semibold text-sm hover:bg-red-100 transition-colors"
        >
          <LogOut size={16} />
          Sair da conta
        </button>
      </div>
    </div>
  )
}
