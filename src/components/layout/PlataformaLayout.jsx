import { Outlet, Navigate } from 'react-router-dom'
import { PlataformaSidebar } from './PlataformaSidebar'
import { useAuth } from '../../contexts/AuthContext'
import { LoadingState } from '../ui/LoadingState'

export function PlataformaLayout() {
  const { admin, loading } = useAuth()

  if (loading) return <LoadingState />
  if (!admin) return <Navigate to="/admin/login" replace />
  if (admin.perfil !== 'super_admin') return <Navigate to="/admin/dashboard" replace />

  return (
    <div className="flex h-screen bg-rp-cinza-claro overflow-hidden">
      <PlataformaSidebar />
      <div className="flex-1 flex flex-col min-w-0 ml-[248px]">
        <header className="bg-white border-b border-rp-cinza-borda px-6 py-3 flex items-center justify-between flex-shrink-0">
          <span className="text-xs font-bold text-rp-cinza-medio uppercase tracking-widest">
            Painel da Plataforma
          </span>
          <div className="flex items-center gap-3">
            <span className="text-sm text-rp-texto font-medium">{admin.nome}</span>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold"
              style={{ backgroundColor: '#e67e22' }}
            >
              {admin.iniciais ?? admin.nome?.slice(0, 2).toUpperCase()}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-y-auto">
          <div className="p-6 max-w-[1400px] mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
