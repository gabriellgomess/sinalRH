import { useState } from 'react'
import { Save, Lock, Info } from 'lucide-react'
import { permissaoService } from '../../services/adminService'
import { usePermissoes } from '../../contexts/PermissoesContext'

/**
 * Matriz perfil × módulo. A empresa só pode RESTRINGIR o padrão definido
 * pela Plataforma — o que não vem liberado no padrão aparece bloqueado.
 */
export function MatrizPermissoes() {
  const { modulos, perfis, padrao, matriz: matrizInicial, recarregar } = usePermissoes()
  const [matriz, setMatriz] = useState(matrizInicial)
  const [salvando, setSalvando] = useState(false)
  const [salvo, setSalvo] = useState(false)
  const [erro, setErro] = useState('')

  if (!modulos || !matriz) return null

  const perfisEditaveis = Object.keys(perfis).filter((p) => p !== 'admin')

  function alternar(perfil, modulo) {
    if (!padrao[perfil]?.[modulo]) return // fora do teto da Plataforma
    setMatriz((m) => ({ ...m, [perfil]: { ...m[perfil], [modulo]: !m[perfil][modulo] } }))
    setSalvo(false)
  }

  async function salvar() {
    setSalvando(true)
    setErro('')
    try {
      const res = await permissaoService.salvarMatriz(matriz)
      setMatriz(res.matriz)
      setSalvo(true)
      recarregar()
      setTimeout(() => setSalvo(false), 3000)
    } catch (err) {
      setErro(err.response?.data?.message || 'Não foi possível salvar as permissões.')
    } finally {
      setSalvando(false)
    }
  }

  return (
    <div>
      <h4 className="text-sm font-bold text-rp-azul mb-1">Permissões por perfil</h4>
      <p className="text-xs text-rp-cinza-medio mb-3">
        Define quais módulos cada perfil enxerga no menu e pode acessar pela API. O
        Administrador tem acesso total e não é editável.
      </p>

      <div className="flex items-start gap-2 bg-rp-azul-suave rounded-lg px-3 py-2.5 mb-4">
        <Info size={13} className="text-rp-azul flex-shrink-0 mt-0.5" />
        <p className="text-[11px] text-rp-azul leading-relaxed">
          Itens com cadeado não estão liberados no padrão da Sara Linhar Consultoria para
          aquele perfil. Você pode restringir o que está liberado, mas não ampliar.
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-rp-cinza-borda">
              <th className="text-left font-semibold text-rp-cinza-medio uppercase tracking-wide py-2 pr-3">Módulo</th>
              {perfisEditaveis.map((p) => (
                <th key={p} className="text-center font-semibold text-rp-cinza-medio uppercase tracking-wide py-2 px-2 whitespace-nowrap">
                  {perfis[p]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.entries(modulos).map(([modulo, label]) => (
              <tr key={modulo} className="border-b border-rp-cinza-borda/60">
                <td className="py-2 pr-3 text-rp-texto">{label}</td>
                {perfisEditaveis.map((perfil) => {
                  const noPadrao = !!padrao[perfil]?.[modulo]
                  const ativo = !!matriz[perfil]?.[modulo]
                  return (
                    <td key={perfil} className="text-center py-2 px-2">
                      {noPadrao ? (
                        <input
                          type="checkbox"
                          checked={ativo}
                          onChange={() => alternar(perfil, modulo)}
                          className="w-4 h-4 accent-rp-azul cursor-pointer"
                        />
                      ) : (
                        <Lock size={12} className="text-rp-cinza-medio mx-auto" title="Não liberado no padrão da Plataforma" />
                      )}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {erro && <p className="text-xs text-red-600 mt-3">{erro}</p>}

      <div className="flex items-center justify-end gap-3 mt-4">
        {salvo && <span className="text-xs text-green-600 font-semibold">Salvo.</span>}
        <button onClick={salvar} disabled={salvando}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-rp-azul text-white text-xs font-semibold hover:bg-rp-azul-deep transition-colors disabled:opacity-40">
          <Save size={13} /> {salvando ? 'Salvando...' : 'Salvar permissões'}
        </button>
      </div>

      <p className="text-[11px] text-rp-cinza-medio mt-3">
        O perfil <strong>Somente leitura</strong> visualiza os módulos marcados, mas nunca cria,
        edita ou exclui — isso é garantido no servidor, não só no menu.
      </p>
    </div>
  )
}
