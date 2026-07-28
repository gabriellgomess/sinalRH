import { createContext, useContext, useEffect, useState } from 'react'
import { permissaoService } from '../services/adminService'

const PermissoesContext = createContext(null)

/**
 * Permissões efetivas do usuário logado no painel admin.
 * O backend é a fonte da verdade — aqui só escondemos o que não é permitido.
 */
export function PermissoesProvider({ children }) {
  const [dados, setDados] = useState(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    permissaoService.buscar()
      .then(setDados)
      .catch(() => setDados(null))
      .finally(() => setCarregando(false))
  }, [])

  const pode = (modulo) => {
    if (!modulo) return true
    if (!dados) return true // enquanto carrega, não esconde nada
    return dados.meus_modulos.includes(modulo)
  }

  return (
    <PermissoesContext.Provider value={{
      ...(dados ?? {}),
      pode,
      carregando,
      somenteLeitura: dados?.somente_leitura ?? false,
      recarregar: () => permissaoService.buscar().then(setDados).catch(() => {})
    }}>
      {children}
    </PermissoesContext.Provider>
  )
}

export function usePermissoes() {
  const ctx = useContext(PermissoesContext)
  if (!ctx) throw new Error('usePermissoes deve ser usado dentro de PermissoesProvider')
  return ctx
}
