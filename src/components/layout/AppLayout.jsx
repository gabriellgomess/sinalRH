import { useState, useEffect } from 'react'
import { Outlet, Navigate } from 'react-router-dom'
import { MobileBottomNav } from './MobileBottomNav'
import { AppSidebar } from './AppSidebar'
import { useAuth } from '../../contexts/AuthContext'
import { LoadingState } from '../ui/LoadingState'
import { produtosAppService } from '../../services/appService'

export function AppLayout() {
  const { user, loading } = useAuth()
  const [produtos, setProdutos] = useState(null) // null = ainda carregando

  useEffect(() => {
    if (!user) return
    produtosAppService.listar()
      .then((keys) => setProdutos(Array.isArray(keys) ? keys : []))
      .catch(() => setProdutos([]))
  }, [user])

  if (loading) return <LoadingState />
  if (!user) return <Navigate to="/login" replace />

  return (
    <div className="min-h-screen bg-rp-cinza-claro">
      {/* Sidebar fixa (somente desktop) */}
      <AppSidebar produtos={produtos} />

      {/* Área de conteúdo: coluna estreita no mobile, larga no desktop */}
      <div className="lg:ml-60">
        <main className="min-h-screen pb-20 lg:pb-8">
          <div className="mx-auto w-full max-w-md lg:max-w-none">
            <Outlet />
          </div>
        </main>
      </div>

      {/* Navegação inferior (somente mobile) */}
      <MobileBottomNav produtos={produtos} />
    </div>
  )
}
