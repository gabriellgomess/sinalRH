import { NavLink } from 'react-router-dom'
import { Home, ClipboardList, Bell, MessageSquare, User, GraduationCap } from 'lucide-react'

const navItems = [
  { icon: Home, label: 'Início', to: '/app' },
  { icon: ClipboardList, label: 'Pesquisas', to: '/app/pesquisas' },
  { icon: GraduationCap, label: 'Cursos', to: '/app/ead' },
  { icon: Bell, label: 'Comunicados', to: '/app/comunicados' },
  { icon: MessageSquare, label: 'Escuta', to: '/app/escuta' },
  { icon: User, label: 'Perfil', to: '/app/perfil' }
]

export function MobileBottomNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white border-t border-rp-cinza-borda">
      <div className="flex items-center">
        {navItems.map(({ icon: Icon, label, to }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/app'}
            className={({ isActive }) =>
              `flex-1 flex flex-col items-center justify-center py-2.5 gap-0.5 transition-colors ${
                isActive ? 'text-rp-azul' : 'text-rp-cinza-medio'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon size={20} strokeWidth={isActive ? 2.2 : 1.8} />
                <span className={`text-[10px] font-${isActive ? 'semibold' : 'medium'}`}>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </div>
      <div className="h-safe-area-bottom" style={{ height: 'env(safe-area-inset-bottom, 0px)' }} />
    </nav>
  )
}
