import { NavLink, useNavigate } from 'react-router-dom'
import { Home, ClipboardList, GraduationCap, Bell, MessageSquare, User, LogOut } from 'lucide-react'
import { SinalLogo } from './SinalLogo'
import { useAuth } from '../../contexts/AuthContext'

const navItems = [
  { icon: Home, label: 'Início', to: '/app', end: true },
  { icon: ClipboardList, label: 'Pesquisas', to: '/app/pesquisas', productKey: 'pesquisas' },
  { icon: GraduationCap, label: 'Cursos', to: '/app/ead', productKey: 'ead' },
  { icon: Bell, label: 'Comunicados', to: '/app/comunicados' },
  { icon: MessageSquare, label: 'Escuta', to: '/app/escuta', productKey: 'canal_escuta' },
  { icon: User, label: 'Perfil', to: '/app/perfil' },
]

export function AppSidebar({ produtos = null }) {
  const { user, logoutColaborador } = useAuth()
  const navigate = useNavigate()
  const temProduto = (key) => !key || (Array.isArray(produtos) && produtos.includes(key))
  const itens = navItems.filter((i) => temProduto(i.productKey))

  function handleLogout() {
    if (logoutColaborador) logoutColaborador()
    navigate('/login')
  }

  return (
    <aside className="hidden lg:flex fixed left-0 top-0 h-screen w-60 flex-col z-30" style={{ backgroundColor: '#003366' }}>
      <div className="px-4 py-5 border-b border-white/10 flex justify-center">
        <SinalLogo size="md" dark />
      </div>

      <div className="px-4 py-4 border-b border-white/10 flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
          {user?.iniciais || user?.nome?.slice(0, 2)?.toUpperCase() || '?'}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-white truncate">{user?.nome}</p>
          <p className="text-[11px] text-white/50 truncate">{user?.empresa?.nome_fantasia || 'Colaborador'}</p>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-hide">
        {itens.map(({ icon: Icon, label, to, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              isActive
                ? 'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-white/15 border-l-2 border-rp-laranja transition-all mb-0.5'
                : 'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-all mb-0.5'
            }
          >
            <Icon size={17} strokeWidth={1.8} />
            <span className="flex-1">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-white/50 hover:text-white/80 hover:bg-white/5 transition-all w-full"
        >
          <LogOut size={15} strokeWidth={1.8} />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  )
}
