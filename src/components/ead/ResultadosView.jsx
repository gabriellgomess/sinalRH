import { Users, Activity, CheckCircle2, Award } from 'lucide-react'

const statusLabel = { nao_iniciado: 'Não iniciado', em_andamento: 'Em andamento', concluido: 'Concluído' }
const statusCls = { nao_iniciado: 'text-rp-cinza-medio', em_andamento: 'text-rp-azul', concluido: 'text-green-600' }

/**
 * Exibe resumo (cards) + tabela de execução e notas.
 * props: resumo, colaboradores[], mostrarEmpresa (bool)
 */
export function ResultadosView({ resumo, colaboradores = [], mostrarEmpresa = false }) {
  const cards = [
    { icon: Users, label: 'Matriculados', valor: resumo?.matriculados ?? 0 },
    { icon: Activity, label: 'Em andamento', valor: resumo?.em_andamento ?? 0 },
    { icon: CheckCircle2, label: 'Concluídos', valor: resumo?.concluidos ?? 0 },
    { icon: Activity, label: 'Execução média', valor: `${resumo?.execucao_media ?? 0}%` },
    { icon: Award, label: 'Nota média', valor: resumo?.nota_media != null ? `${resumo.nota_media}%` : '—' },
  ]

  return (
    <div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-5">
        {cards.map((c) => (
          <div key={c.label} className="bg-white rounded-xl shadow-card p-4">
            <c.icon size={16} className="text-rp-azul mb-2" />
            <p className="text-xl font-bold text-rp-texto">{c.valor}</p>
            <p className="text-[11px] text-rp-cinza-medio">{c.label}</p>
          </div>
        ))}
      </div>

      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-rp-cinza-medio border-b border-rp-cinza-borda">
                <th className="px-4 py-3 font-semibold">Colaborador</th>
                {mostrarEmpresa && <th className="px-4 py-3 font-semibold">Empresa</th>}
                <th className="px-4 py-3 font-semibold">Setor</th>
                <th className="px-4 py-3 font-semibold">Status</th>
                <th className="px-4 py-3 font-semibold">Execução</th>
                <th className="px-4 py-3 font-semibold">Nota</th>
                <th className="px-4 py-3 font-semibold">Concluído</th>
              </tr>
            </thead>
            <tbody>
              {colaboradores.length === 0 ? (
                <tr><td colSpan={mostrarEmpresa ? 7 : 6} className="px-4 py-8 text-center text-rp-cinza-medio">Nenhuma matrícula ainda.</td></tr>
              ) : colaboradores.map((c, i) => (
                <tr key={i} className="border-b border-rp-cinza-borda/60 last:border-0">
                  <td className="px-4 py-3 text-rp-texto">{c.colaborador}</td>
                  {mostrarEmpresa && <td className="px-4 py-3 text-rp-cinza-medio">{c.empresa || '—'}</td>}
                  <td className="px-4 py-3 text-rp-cinza-medio">{c.setor || '—'}</td>
                  <td className={`px-4 py-3 font-medium ${statusCls[c.status] || ''}`}>{statusLabel[c.status] || c.status}</td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-rp-cinza-borda rounded-full h-1.5 overflow-hidden">
                        <div className="h-full bg-rp-azul rounded-full" style={{ width: `${c.progresso}%` }} />
                      </div>
                      <span className="text-xs text-rp-cinza-medio">{c.progresso}%</span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-rp-texto">{c.nota_final != null ? `${c.nota_final}%` : '—'}</td>
                  <td className="px-4 py-3 text-rp-cinza-medio">{c.concluido_em || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
