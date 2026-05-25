import { NavLink, useNavigate } from 'react-router-dom'
import { LayoutDashboard, Building2, LogOut, PlusCircle } from 'lucide-react'
import { RadarLogo } from './RadarLogo'
import { useAuth } from '../../contexts/AuthContext'

const navItems = [
  { group: 'VISÃO GERAL', items: [
    { icon: LayoutDashboard, label: 'Dashboard', to: '/plataforma' },
  ]},
  { group: 'CLIENTES', items: [
    { icon: Building2,   label: 'Todos os clientes', to: '/plataforma/clientes' },
    { icon: PlusCircle,  label: 'Novo cliente',       to: '/plataforma/clientes/novo' },
  ]},
]

export function PlataformaSidebar() {
  const { logoutAdmin } = useAuth()
  const navigate = useNavigate()

  function handleLogout() {
    logoutAdmin()
    navigate('/admin/login')
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-[248px] flex flex-col z-30" style={{ backgroundColor: '#1a1a2e' }}>
      <div className="px-3 py-4 border-b border-white/10">
        <RadarLogo size="sm" dark />
        <span className="block mt-2 text-[10px] font-bold text-rp-laranja uppercase tracking-widest">
          Plataforma · Sara Linhar
        </span>
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-hide">
        {navItems.map((group) => (
          <div key={group.group} className="mb-5">
            <p className="px-4 mb-1.5 text-[10px] font-bold tracking-widest text-white/40 uppercase">
              {group.group}
            </p>
            {group.items.map(({ icon: Icon, label, to }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/plataforma'}
                className={({ isActive }) =>
                  isActive
                    ? 'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-white/15 border-l-2 border-rp-laranja transition-all mb-0.5'
                    : 'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-all mb-0.5'
                }
              >
                <Icon size={16} strokeWidth={1.8} />
                <span className="flex-1">{label}</span>
              </NavLink>
            ))}
          </div>
        ))}
      </nav>

      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-4 py-2 rounded-lg text-sm text-white/50 hover:text-white/80 hover:bg-white/5 transition-all w-full"
        >
          <LogOut size={14} strokeWidth={1.8} />
          <span>Sair</span>
        </button>
      </div>
    </aside>
  )
}
