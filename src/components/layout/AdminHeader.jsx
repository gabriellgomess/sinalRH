import { Bell, Search } from 'lucide-react'
import { useAuth } from '../../contexts/AuthContext'

export function AdminHeader() {
  const { admin } = useAuth()

  return (
    <header className="h-16 bg-white border-b border-rp-cinza-borda flex items-center justify-between px-6 flex-shrink-0">
      <div className="relative flex-1 max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-rp-cinza-medio" />
        <input
          type="search"
          placeholder="Buscar pesquisa, setor, colaborador..."
          className="w-full pl-9 pr-4 py-2 text-sm bg-rp-cinza-claro border border-transparent rounded-lg text-rp-texto placeholder-rp-cinza-medio focus:outline-none focus:ring-2 focus:ring-rp-azul focus:bg-white transition-all"
        />
      </div>

      <div className="flex items-center gap-3 ml-4">
        <button className="relative p-2 rounded-lg hover:bg-rp-cinza-claro transition-colors text-rp-cinza-medio hover:text-rp-azul">
          <Bell size={18} strokeWidth={1.8} />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-rp-laranja rounded-full" />
        </button>

        <div className="flex items-center gap-2.5 pl-3 border-l border-rp-cinza-borda">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
            style={{ backgroundColor: '#003366' }}
          >
            {admin?.iniciais || 'MS'}
          </div>
          <div className="hidden md:block">
            <div className="text-sm font-semibold text-rp-texto leading-tight">{admin?.nome || 'Marina S.'}</div>
            <div className="text-xs text-rp-cinza-medio">{admin?.cargo || 'Diretora de RH'}</div>
          </div>
        </div>
      </div>
    </header>
  )
}
