import { useState, useEffect } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import {
  LayoutDashboard, AlertTriangle, ClipboardList, Heart,
  MessageSquare, Users, Building2, HelpCircle, LogOut, ShieldCheck,
  RefreshCw, Award
} from 'lucide-react'
import { RadarLogo } from './RadarLogo'
import { useAuth } from '../../contexts/AuthContext'
import { dashboardService, produtosContratadosService } from '../../services/adminService'

const navItems = [
  { group: 'GERAL', items: [
    { icon: LayoutDashboard, label: 'Dashboard', to: '/admin/dashboard' },
    { icon: AlertTriangle, label: 'Mapa de riscos', to: '/admin/riscos', productKey: 'mapa_riscos' },
    { icon: ClipboardList, label: 'Pesquisas', to: '/admin/pesquisas', productKey: 'pesquisas' },
    { icon: Heart, label: 'Check-ins', to: '/admin/checkins', productKey: 'checkins' },
    { icon: ShieldCheck, label: 'NR-1 / PGR', to: '/admin/nr1', checkProduct: (prods) => prods.some(p => (p.produto === 'diagnostico_nr1' || p.produto === 'plano_acao_nr1') && p.status === 'ativo') },
    { icon: MessageSquare, label: 'Canal de escuta', to: '/admin/escuta', badgeKey: 'escuta', productKey: 'canal_escuta' },
    { icon: RefreshCw, label: 'Feedback 360', to: '/admin/feedback', productKey: 'feedback' },
    { icon: Award, label: 'PDI', to: '/admin/pdi', productKey: 'pdi' },
  ]},
  { group: 'GESTÃO', items: [
    { icon: Building2, label: 'Minha empresa', to: '/admin/empresas' },
  ]}
]

export function Sidebar() {
  const { logoutAdmin } = useAuth()
  const navigate = useNavigate()
  const [badges, setBadges] = useState({})
  const [activeProducts, setActiveProducts] = useState([])
  const [loadingProducts, setLoadingProducts] = useState(true)

  useEffect(() => {
    dashboardService.getAlertas()
      .then((data) => {
        if (data.escuta_pendentes > 0) {
          setBadges({ escuta: data.escuta_pendentes })
        }
      })
      .catch(() => {})
  }, [])

  useEffect(() => {
    produtosContratadosService.listar()
      .then((res) => {
        if (res && res.success && Array.isArray(res.data)) {
          setActiveProducts(res.data)
        } else if (Array.isArray(res)) {
          setActiveProducts(res)
        }
      })
      .catch(() => {})
      .finally(() => setLoadingProducts(false))
  }, [])

  function handleLogout() {
    logoutAdmin()
    navigate('/admin/login')
  }

  const isProductActive = (item) => {
    if (!item.productKey && !item.checkProduct) return true
    if (item.checkProduct) return item.checkProduct(activeProducts)
    return activeProducts.some(p => p.produto === item.productKey && p.status === 'ativo')
  }

  return (
    <aside className="fixed left-0 top-0 h-screen w-[248px] flex flex-col z-30" style={{ backgroundColor: '#003366' }}>
      <div className="px-3 py-4 border-b border-white/10 flex justify-center">
        <RadarLogo size="md" dark />
      </div>

      <nav className="flex-1 px-3 py-4 overflow-y-auto scrollbar-hide">
        {navItems.map((group) => {
          const visibleItems = group.items.filter(isProductActive)
          if (visibleItems.length === 0) return null

          return (
            <div key={group.group} className="mb-5">
              <p className="px-4 mb-1.5 text-[10px] font-bold tracking-widest text-white/40 uppercase">
                {group.group}
              </p>
              {visibleItems.map(({ icon: Icon, label, to, badgeKey }) => {
                const badgeCount = badgeKey ? badges[badgeKey] : null
                return (
                  <NavLink
                    key={to}
                    to={to}
                    className={({ isActive }) =>
                      isActive
                        ? 'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-semibold text-white bg-white/15 border-l-2 border-rp-laranja transition-all mb-0.5'
                        : 'flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:bg-white/10 hover:text-white transition-all mb-0.5'
                    }
                  >
                    <Icon size={16} strokeWidth={1.8} />
                    <span className="flex-1">{label}</span>
                    {badgeCount > 0 && (
                      <span className="bg-rp-laranja text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                        {badgeCount}
                      </span>
                    )}
                  </NavLink>
                )
              })}
            </div>
          )
        })}
      </nav>

      <div className="px-3 py-4 border-t border-white/10">
        <button
          onClick={() => navigate('/admin/configuracoes')}
          className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm text-white/60 hover:text-white hover:bg-white/10 transition-all w-full mb-1"
        >
          <HelpCircle size={16} strokeWidth={1.8} />
          <div className="text-left">
            <div className="text-xs font-medium text-white/60">Suporte da consultoria</div>
            <div className="text-[10px] text-white/40">contato@saralinhar.com.br</div>
          </div>
        </button>
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
